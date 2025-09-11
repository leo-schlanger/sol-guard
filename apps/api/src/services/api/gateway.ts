import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { aiEngine } from '../ai-analysis/engine';
import { auditEngine } from '../audit/audit-engine';
import { realTimeMonitor } from '../monitoring/real-time-engine';
import { certificationEngine } from '../certification/cnft-engine';

// Request/Response Schemas
export const AnalyzeContractSchema = z.object({
  contractCode: z.string().min(1),
  contractAddress: z.string().optional(),
  metadata: z.object({
    name: z.string().optional(),
    symbol: z.string().optional(),
    description: z.string().optional(),
    githubUrl: z.string().url().optional()
  }).optional(),
  analysisLevel: z.enum(['basic', 'standard', 'comprehensive']).default('standard')
});

export const AuditContractSchema = z.object({
  contractAddress: z.string().optional(),
  githubRepo: z.string().url().optional(),
  contractCode: z.string().optional(),
  auditLevel: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),
  includeGasOptimization: z.boolean().default(true),
  includeFormalVerification: z.boolean().default(false),
  customRules: z.array(z.string()).default([])
});

export const MonitorContractSchema = z.object({
  address: z.string(),
  type: z.enum(['program', 'token', 'wallet']),
  alertThresholds: z.array(z.object({
    condition: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    threshold: z.number(),
    enabled: z.boolean().default(true)
  })).default([]),
  webhooks: z.array(z.string().url()).default([]),
  notifications: z.array(z.object({
    type: z.enum(['email', 'slack', 'webhook']),
    endpoint: z.string(),
    enabled: z.boolean().default(true)
  })).default([])
});

export const CertificateSchema = z.object({
  auditId: z.string(),
  recipientWallet: z.string()
});

// Authentication and Authorization
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    tier: 'basic' | 'standard' | 'enterprise';
    permissions: string[];
  };
}

// Rate Limiting Configuration
const createRateLimit = (windowMs: number, max: number) => ({
  windowMs,
  max,
  message: {
    error: 'Rate limit exceeded',
    retryAfter: Math.ceil(windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (request: FastifyRequest) => {
    const user = (request as AuthenticatedRequest).user;
    return user ? user.id : request.ip;
  }
});

// Middleware for authentication
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    // In a real implementation, you would verify the JWT token
    // For now, we'll mock the user data
    const user = {
      id: 'user_123',
      email: 'user@example.com',
      tier: 'enterprise' as const,
      permissions: ['analyze', 'audit', 'monitor', 'certify']
    };

    (request as AuthenticatedRequest).user = user;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid authentication token' });
  }
}

// Middleware for authorization
function authorize(requiredPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as AuthenticatedRequest).user;
    
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const hasPermission = requiredPermissions.some(permission => 
      user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return reply.status(403).send({ 
        error: 'Insufficient permissions',
        required: requiredPermissions,
        userPermissions: user.permissions
      });
    }
  };
}

// Middleware for request validation
function validateRequest(schema: z.ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.body);
      request.body = validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors
        });
      }
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  };
}

// Middleware for metrics collection
async function metricsMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now();
  
  reply.addHook('onSend', async (request, reply, payload) => {
    const duration = Date.now() - startTime;
    
    // In a real implementation, you would send metrics to your monitoring system
    console.log(`📊 ${request.method} ${request.url} - ${reply.statusCode} - ${duration}ms`);
    
    return payload;
  });
}

// API Route Handlers
async function analyzeContractHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as AuthenticatedRequest).user;
    const data = request.body as z.infer<typeof AnalyzeContractSchema>;
    
    console.log(`🧠 AI Analysis request from user ${user.id} for contract: ${data.contractAddress || 'unknown'}`);
    
    const result = await aiEngine.analyzeContract({
      contractCode: data.contractCode,
      contractAddress: data.contractAddress,
      metadata: data.metadata,
      analysisLevel: data.analysisLevel
    });
    
    return reply.send({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Analysis error:', error);
    return reply.status(500).send({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function auditContractHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as AuthenticatedRequest).user;
    const data = request.body as z.infer<typeof AuditContractSchema>;
    
    console.log(`🔍 Audit request from user ${user.id} for contract: ${data.contractAddress || 'unknown'}`);
    
    const result = await auditEngine.auditContract({
      contractAddress: data.contractAddress,
      githubRepo: data.githubRepo,
      contractCode: data.contractCode,
      auditLevel: data.auditLevel,
      includeGasOptimization: data.includeGasOptimization,
      includeFormalVerification: data.includeFormalVerification,
      customRules: data.customRules
    });
    
    return reply.send({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Audit error:', error);
    return reply.status(500).send({
      error: 'Audit failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function monitorContractHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as AuthenticatedRequest).user;
    const data = request.body as z.infer<typeof MonitorContractSchema>;
    
    console.log(`📡 Monitoring request from user ${user.id} for ${data.type}: ${data.address}`);
    
    // Add monitoring target
    await realTimeMonitor.addMonitoringTarget({
      address: data.address,
      type: data.type,
      alertThresholds: data.alertThresholds,
      webhooks: data.webhooks,
      notifications: data.notifications
    });
    
    return reply.send({
      success: true,
      message: `Monitoring started for ${data.address}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Monitoring error:', error);
    return reply.status(500).send({
      error: 'Monitoring setup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function certificateHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as AuthenticatedRequest).user;
    const data = request.body as z.infer<typeof CertificateSchema>;
    
    console.log(`🏆 Certificate request from user ${user.id} for audit: ${data.auditId}`);
    
    // In a real implementation, you would fetch the audit data
    const mockAuditData = {
      auditId: data.auditId,
      contractAddress: '11111111111111111111111111111111',
      overallScore: 85,
      auditLevel: 'standard',
      findings: { critical: 0, high: 1, medium: 2, low: 3, info: 5 },
      recommendations: ['Fix high severity issue', 'Implement additional checks'],
      executionTime: 5000,
      timestamp: new Date().toISOString()
    };
    
    const result = await certificationEngine.issueCertificate(
      mockAuditData,
      new (await import('@solana/web3.js')).PublicKey(data.recipientWallet)
    );
    
    return reply.send({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Certificate error:', error);
    return reply.status(500).send({
      error: 'Certificate issuance failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getMonitoringMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const metrics = realTimeMonitor.getMetrics();
    const activeAlerts = realTimeMonitor.getActiveAlerts();
    
    return reply.send({
      success: true,
      data: {
        metrics,
        activeAlerts: activeAlerts.length,
        alerts: activeAlerts.slice(0, 10) // Return last 10 alerts
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Metrics error:', error);
    return reply.status(500).send({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function verifyCertificateHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { certificateId } = request.params as { certificateId: string };
    
    const result = await certificationEngine.verifyCertificate(certificateId);
    
    return reply.send({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Certificate verification error:', error);
    return reply.status(500).send({
      error: 'Certificate verification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// WebSocket handler for real-time updates
async function websocketHandler(connection: any, request: FastifyRequest) {
  const user = (request as AuthenticatedRequest).user;
  
  console.log(`🔌 WebSocket connection from user ${user.id}`);
  
  // Subscribe to real-time updates
  const updateHandler = (data: any) => {
    connection.socket.send(JSON.stringify({
      type: 'update',
      data,
      timestamp: new Date().toISOString()
    }));
  };
  
  const alertHandler = (alert: any) => {
    connection.socket.send(JSON.stringify({
      type: 'alert',
      data: alert,
      timestamp: new Date().toISOString()
    }));
  };
  
  realTimeMonitor.on('update', updateHandler);
  realTimeMonitor.on('alert', alertHandler);
  
  // Handle client messages
  connection.socket.on('message', (message: any) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'subscribe':
          // Subscribe to specific contract monitoring
          console.log(`📡 User ${user.id} subscribing to: ${data.contractAddress}`);
          break;
        case 'unsubscribe':
          // Unsubscribe from monitoring
          console.log(`📡 User ${user.id} unsubscribing from: ${data.contractAddress}`);
          break;
        case 'ping':
          connection.socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  // Cleanup on disconnect
  connection.socket.on('close', () => {
    console.log(`🔌 WebSocket disconnected for user ${user.id}`);
    realTimeMonitor.off('update', updateHandler);
    realTimeMonitor.off('alert', alertHandler);
  });
}

// Register API routes
export async function registerApiRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        ai: 'operational',
        audit: 'operational',
        monitoring: 'operational',
        certification: 'operational'
      }
    });
  });

  // API Documentation
  fastify.get('/api/v1', async (request, reply) => {
    return reply.send({
      name: 'SolGuard API',
      version: '1.0.0',
      description: 'Advanced Solana Security Platform API',
      endpoints: {
        analyze: 'POST /api/v1/analyze - AI-powered contract analysis',
        audit: 'POST /api/v1/audit - Comprehensive security audit',
        monitor: 'POST /api/v1/monitor - Real-time monitoring setup',
        certificate: 'POST /api/v1/certificates - Issue security certificates',
        metrics: 'GET /api/v1/metrics - Monitoring metrics',
        verify: 'GET /api/v1/certificates/:id/verify - Verify certificate'
      },
      documentation: '/docs',
      websocket: '/ws'
    });
  });

  // AI Analysis endpoint
  fastify.post('/api/v1/analyze',
    {
      preHandler: [
        authenticate,
        authorize(['analyze']),
        validateRequest(AnalyzeContractSchema),
        metricsMiddleware
      ],
      config: {
        rateLimit: createRateLimit(15 * 60 * 1000, 100) // 100 requests per 15 minutes
      }
    },
    analyzeContractHandler
  );

  // Audit endpoint
  fastify.post('/api/v1/audit',
    {
      preHandler: [
        authenticate,
        authorize(['audit']),
        validateRequest(AuditContractSchema),
        metricsMiddleware
      ],
      config: {
        rateLimit: createRateLimit(60 * 60 * 1000, 10) // 10 audits per hour
      }
    },
    auditContractHandler
  );

  // Monitoring endpoint
  fastify.post('/api/v1/monitor',
    {
      preHandler: [
        authenticate,
        authorize(['monitor']),
        validateRequest(MonitorContractSchema),
        metricsMiddleware
      ]
    },
    monitorContractHandler
  );

  // Certificate issuance endpoint
  fastify.post('/api/v1/certificates',
    {
      preHandler: [
        authenticate,
        authorize(['certify']),
        validateRequest(CertificateSchema),
        metricsMiddleware
      ],
      config: {
        rateLimit: createRateLimit(15 * 60 * 1000, 50) // 50 certificates per 15 minutes
      }
    },
    certificateHandler
  );

  // Monitoring metrics endpoint
  fastify.get('/api/v1/metrics',
    {
      preHandler: [
        authenticate,
        authorize(['monitor']),
        metricsMiddleware
      ]
    },
    getMonitoringMetricsHandler
  );

  // Certificate verification endpoint
  fastify.get('/api/v1/certificates/:certificateId/verify',
    {
      preHandler: [
        authenticate,
        metricsMiddleware
      ]
    },
    verifyCertificateHandler
  );

  // WebSocket endpoint for real-time updates
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, websocketHandler);
  });

  console.log('✅ API routes registered successfully');
}
