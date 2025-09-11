import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { config } from './config'
import { registerRoutes } from './routes'
import { registerServices } from './services'

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

  await fastify.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
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
        description: 'Plataforma de Segurança IA para Ecossistema Solana',
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

  // Register routes
  await registerRoutes(fastify)

  return fastify
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
