import { FastifyInstance } from 'fastify'
import { DatabaseService } from './DatabaseService'
import { RedisService } from './RedisService'
import { SolanaService } from './SolanaService'
import { TokenAnalysisService } from './TokenAnalysisService'
import { RiskScoreService } from './RiskScoreService'
import { AuditService } from './AuditService'
import { AuthService } from './AuthService'
import { NotificationService } from './NotificationService'

export async function registerServices(fastify: FastifyInstance) {
  // Initialize core services
  const databaseService = new DatabaseService()
  const redisService = new RedisService()
  const solanaService = new SolanaService()
  
  // Initialize business services
  const tokenAnalysisService = new TokenAnalysisService(solanaService)
  const riskScoreService = new RiskScoreService(databaseService, solanaService)
  const auditService = new AuditService(databaseService)
  const authService = new AuthService(databaseService)
  const notificationService = new NotificationService(redisService)

  // Register services with Fastify
  fastify.decorate('database', databaseService)
  fastify.decorate('redis', redisService)
  fastify.decorate('solana', solanaService)
  fastify.decorate('tokenAnalysis', tokenAnalysisService)
  fastify.decorate('riskScore', riskScoreService)
  fastify.decorate('audit', auditService)
  fastify.decorate('auth', authService)
  fastify.decorate('notifications', notificationService)

  // Initialize services
  await databaseService.initialize()
  await redisService.initialize()
  await solanaService.initialize()
}

// Extend FastifyInstance type
declare module 'fastify' {
  interface FastifyInstance {
    database: DatabaseService
    redis: RedisService
    solana: SolanaService
    tokenAnalysis: TokenAnalysisService
    riskScore: RiskScoreService
    audit: AuditService
    auth: AuthService
    notifications: NotificationService
  }
}
