import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { config } from '../config'

export async function healthRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Health check endpoint
  fastify.get('/', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.NODE_ENV,
      uptime: process.uptime(),
    }
  })

  // Detailed health check
  fastify.get('/detailed', async (request, reply) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      services: {
        database: 'healthy', // TODO: Add actual database health check
        redis: 'healthy', // TODO: Add actual Redis health check
        solana: 'healthy', // TODO: Add actual Solana RPC health check
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
    }

    return health
  })
}
