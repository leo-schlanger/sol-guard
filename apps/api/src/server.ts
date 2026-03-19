import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { config } from './config';
import { registerRoutes } from './routes';
import { registerServices } from './services';
import { registerApiRoutes } from './services/api/gateway';
import { certificationEngine } from './services/certification/cnft-engine';
import { realTimeMonitor } from './services/monitoring/real-time-engine';
import { DatabaseService } from './database';
import { SolanaService } from './services/SolanaService';
import { RiskScoreService } from './services/RiskScoreService';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

async function buildServer() {
  // Register plugins
  await fastify.register(helmet)
  
  await fastify.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  })

  // IP-based rate limiting for free public service
  // 60 requests per minute per IP for anonymous users
  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      // Use X-Forwarded-For for proxied requests, fallback to IP
      const forwarded = request.headers['x-forwarded-for'];
      if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ip.trim();
      }
      return request.ip;
    },
    errorResponseBuilder: (request, context) => ({
      error: 'Rate limit exceeded',
      message: `You have exceeded the rate limit of ${context.max} requests per minute`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
    // Whitelist health check endpoints
    allowList: (request) => {
      return request.url === '/health' || request.url === '/api/health';
    },
  })

  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
  })

  await fastify.register(multipart)

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'SolGuard API',
        description: 'AI Security Platform for the Solana Ecosystem',
        version: '1.0.0',
      },
      host: config.API_HOST,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'tokens', description: 'Token analysis endpoints' },
        { name: 'audits', description: 'Audit endpoints' },
        { name: 'users', description: 'User management endpoints' },
      ],
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  })

  // Register services
  await registerServices(fastify)

  // Initialize advanced services
  await initializeAdvancedServices()

  // Register routes
  await registerRoutes(fastify)

  // Register advanced API routes
  await registerApiRoutes(fastify)

  return fastify
}

async function initializeAdvancedServices() {
  try {
    console.log('🔧 Initializing advanced SolGuard services...')
    
    // Initialize certification system
    await certificationEngine.initializeCertificationSystem()
    
    // Start real-time monitoring (if configured)
    if (process.env.ENABLE_REAL_TIME_MONITORING === 'true') {
      console.log('📡 Starting real-time monitoring system...')
      // You can add default monitoring targets here if needed
    }
    
    console.log('✅ Advanced services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize advanced services:', error)
    // Don't exit the process, just log the error
  }
}

async function start() {
  try {
    const server = await buildServer()
    
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    })

    console.log(`🚀 SolGuard API server running on http://${config.HOST}:${config.PORT}`)
    console.log(`📚 API Documentation available at http://${config.HOST}:${config.PORT}/docs`)
  } catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  await fastify.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  await fastify.close()
  process.exit(0)
})

if (import.meta.url === `file://${process.argv[1]}`) {
  start()
}

export { buildServer }
