import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RiskScoreService } from '../services/RiskScoreService';
import { authenticateRequest } from '../middleware/auth';

const riskScoreParamsSchema = z.object({
  tokenAddress: z.string()
    .min(32)
    .max(44)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid Solana address format')
});

const riskScoreQuerySchema = z.object({
  includeHistory: z.boolean().optional().default(false),
  includeDetailedReport: z.boolean().optional().default(false),
  customWeights: z.object({
    liquidity: z.number().min(0).max(1).optional(),
    holders: z.number().min(0).max(1).optional(),
    programSecurity: z.number().min(0).max(1).optional(),
    marketBehavior: z.number().min(0).max(1).optional()
  }).optional()
});

const riskScoreHistoryQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export default async function riskScoreRoutes(app: FastifyInstance) {
  app.get(
    '/risk-score/:tokenAddress',
    {
      schema: {
        params: riskScoreParamsSchema,
        querystring: riskScoreQuerySchema
      },
      preHandler: [authenticateRequest]
    },
    async (request, reply) => {
      try {
        const { tokenAddress } = request.params as z.infer<typeof riskScoreParamsSchema>;
        const query = request.query as z.infer<typeof riskScoreQuerySchema>;
        
        const riskScore = await app.riskScoreService.calculateRiskScore(tokenAddress, query);
        
        return reply.send(riskScore);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Invalid request parameters',
            details: error.issues
          });
        }
        
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to calculate risk score'
        });
      }
    }
  );

  app.get(
    '/risk-score/:tokenAddress/history',
    {
      schema: {
        params: riskScoreParamsSchema,
        querystring: riskScoreHistoryQuerySchema
      },
      preHandler: [authenticateRequest]
    },
    async (request, reply) => {
      try {
        const { tokenAddress } = request.params as z.infer<typeof riskScoreParamsSchema>;
        const { limit, offset } = request.query as z.infer<typeof riskScoreHistoryQuerySchema>;
        
        const history = await app.riskScoreService.getRiskScoreHistory(tokenAddress, limit, offset);
        
        return reply.send(history);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Invalid request parameters',
            details: error.issues
          });
        }
        
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to get risk score history'
        });
      }
    }
  );
}
