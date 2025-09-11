import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { z } from 'zod'
import { TokenAnalysisService } from '../services/TokenAnalysisService'
import { RiskScoreService } from '../services/RiskScoreService'

const tokenAnalysisSchema = z.object({
  address: z.string().min(1, 'Token address is required'),
  includeHistory: z.boolean().optional().default(false),
  includeDetailedReport: z.boolean().optional().default(false),
})

export async function tokenRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const tokenAnalysisService = new TokenAnalysisService()
  const riskScoreService = new RiskScoreService()

  // Analyze token risk score
  fastify.post('/analyze', {
    schema: {
      description: 'Analyze token risk score',
      tags: ['tokens'],
      body: tokenAnalysisSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                level: { type: 'string' },
                breakdown: { type: 'object' },
                timestamp: { type: 'string' },
                tokenAddress: { type: 'string' },
              },
            },
            processingTime: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const startTime = Date.now()
    
    try {
      const { address, includeHistory, includeDetailedReport } = request.body as z.infer<typeof tokenAnalysisSchema>
      
      // Validate Solana address format
      if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid Solana address format',
        })
      }

      const riskScore = await riskScoreService.calculateRiskScore(address, {
        includeHistory,
        includeDetailedReport,
      })

      const processingTime = Date.now() - startTime

      return {
        success: true,
        data: riskScore,
        processingTime,
      }
    } catch (error) {
      fastify.log.error(error)
      const processingTime = Date.now() - startTime
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to analyze token',
        processingTime,
      })
    }
  })

  // Get token information
  fastify.get('/:address', {
    schema: {
      description: 'Get token information',
      tags: ['tokens'],
      params: {
        type: 'object',
        properties: {
          address: { type: 'string' },
        },
        required: ['address'],
      },
    },
  }, async (request, reply) => {
    try {
      const { address } = request.params as { address: string }
      
      if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid Solana address format',
        })
      }

      const tokenInfo = await tokenAnalysisService.getTokenInfo(address)

      return {
        success: true,
        data: tokenInfo,
      }
    } catch (error) {
      fastify.log.error(error)
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to get token information',
      })
    }
  })

  // Get token risk score history
  fastify.get('/:address/history', {
    schema: {
      description: 'Get token risk score history',
      tags: ['tokens'],
      params: {
        type: 'object',
        properties: {
          address: { type: 'string' },
        },
        required: ['address'],
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 30 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { address } = request.params as { address: string }
      const { limit, offset } = request.query as { limit: number; offset: number }
      
      if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid Solana address format',
        })
      }

      const history = await riskScoreService.getRiskScoreHistory(address, {
        limit,
        offset,
      })

      return {
        success: true,
        data: history,
      }
    } catch (error) {
      fastify.log.error(error)
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to get risk score history',
      })
    }
  })
}
