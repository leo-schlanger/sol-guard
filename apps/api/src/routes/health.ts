import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { Connection } from '@solana/web3.js'
import { createClient } from 'redis'
import { config, featureFlags } from '../config'
import { DatabaseService } from '../database'

export async function healthRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Basic health check endpoint (fast, for load balancers)
  fastify.get('/', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.NODE_ENV,
    }
  })

  // Detailed health check with service status
  fastify.get('/detailed', async (request, reply) => {
    const checks = await Promise.allSettled([
      checkDatabase(fastify),
      checkRedis(),
      checkSolanaRpc(),
    ])

    const [dbResult, redisResult, solanaResult] = checks

    const services = {
      database: getServiceStatus(dbResult),
      redis: getServiceStatus(redisResult),
      solana: getServiceStatus(solanaResult),
    }

    const allHealthy = Object.values(services).every(s => s.status === 'healthy')

    const health = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      services,
      features: {
        aiAnalysis: featureFlags.AI_ANALYSIS_ENABLED,
        premiumRpc: featureFlags.HELIUS_ENABLED || featureFlags.QUICKNODE_ENABLED,
        realNftMinting: featureFlags.REAL_NFT_MINTING,
        maxSubscriptions: featureFlags.MAX_MONITORING_SUBSCRIPTIONS,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    }

    // Return 503 if critical services are down
    if (services.database.status !== 'healthy') {
      reply.code(503)
    }

    return health
  })

  // Readiness probe (for Kubernetes/Docker)
  fastify.get('/ready', async (request, reply) => {
    try {
      const dbHealthy = await checkDatabase(fastify)
      if (!dbHealthy) {
        reply.code(503)
        return { ready: false, reason: 'Database not available' }
      }
      return { ready: true }
    } catch {
      reply.code(503)
      return { ready: false, reason: 'Health check failed' }
    }
  })

  // Liveness probe (for Kubernetes/Docker)
  fastify.get('/live', async (request, reply) => {
    return { live: true, pid: process.pid }
  })
}

async function checkDatabase(fastify: FastifyInstance): Promise<boolean> {
  try {
    const db = fastify.db as DatabaseService | undefined
    if (!db) {
      // Database service not initialized yet - not critical for free MVP
      return true
    }
    return await db.healthCheck()
  } catch {
    return false
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const client = createClient({ url: config.REDIS_URL })
    await client.connect()
    const pong = await client.ping()
    await client.disconnect()
    return pong === 'PONG'
  } catch {
    // Redis is optional for free MVP - return true to not block
    return true
  }
}

async function checkSolanaRpc(): Promise<boolean> {
  try {
    const connection = new Connection(config.SOLANA_RPC_URL, 'confirmed')
    const version = await connection.getVersion()
    return !!version
  } catch {
    return false
  }
}

function getServiceStatus(result: PromiseSettledResult<boolean>): {
  status: 'healthy' | 'unhealthy'
  latency?: number
} {
  if (result.status === 'fulfilled' && result.value) {
    return { status: 'healthy' }
  }
  return { status: 'unhealthy' }
}
