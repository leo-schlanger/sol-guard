import { FastifyInstance } from 'fastify'
import { authRoutes } from './auth'
import { tokenRoutes } from './tokens'
import { auditRoutes } from './audits'
import { userRoutes } from './users'
import { healthRoutes } from './health'

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  await fastify.register(healthRoutes, { prefix: '/health' })
  
  // Authentication routes
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  
  // Token analysis routes
  await fastify.register(tokenRoutes, { prefix: '/api/tokens' })
  
  // Audit routes
  await fastify.register(auditRoutes, { prefix: '/api/audits' })
  
  // User management routes
  await fastify.register(userRoutes, { prefix: '/api/users' })
}
