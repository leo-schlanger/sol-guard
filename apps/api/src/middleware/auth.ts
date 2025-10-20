import { FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseService } from '../services/DatabaseService';

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({
      error: 'API key is required'
    });
  }

  try {
    const db = request.server.db as DatabaseService;
    const apiKeyData = await db.apiKeys.findUnique({
      where: { key: apiKey }
    });

    if (!apiKeyData || !apiKeyData.isActive) {
      return reply.status(401).send({
        error: 'Invalid or inactive API key'
      });
    }

    // Add rate limiting
    const rateLimit = await checkRateLimit(apiKey);
    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: rateLimit.retryAfter
      });
    }

    // Log API usage
    await logApiUsage(apiKey, request.routerPath, request.method);

    // Add user data to request for downstream use
    request.user = {
      id: apiKeyData.userId,
      type: apiKeyData.type
    };

  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Authentication failed'
    });
  }
}

async function checkRateLimit(apiKey: string) {
  // Implement rate limiting logic here
  // This is a placeholder that always allows requests
  return { allowed: true, retryAfter: 0 };
}

async function logApiUsage(
  apiKey: string,
  endpoint: string,
  method: string
) {
  // Implement API usage logging here
  // This is a placeholder
}
