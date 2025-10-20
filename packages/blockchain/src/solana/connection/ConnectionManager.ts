import { Connection, ConnectionConfig, PublicKey, TransactionSignature } from '@solana/web3.js';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import LRU from 'lru-cache';
import { z } from 'zod';
import { EventEmitter } from 'events';
import {
  ConnectionManager,
  ConnectionManagerConfig,
  EndpointConfig,
  EndpointHealth,
  ConnectionError,
} from './types';
import { TransactionMonitor, TransactionMonitorConfig } from './TransactionMonitor';

const DEFAULT_CONFIG: Partial<ConnectionManagerConfig> = {
  healthCheckInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreaker: {
    threshold: 5,
    timeout: 60000, // 1 minute
  },
};

export class SolanaConnectionManager extends EventEmitter implements ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private monitors: Map<string, TransactionMonitor> = new Map();
  private healthStatus: Map<string, EndpointHealth> = new Map();
  private currentEndpoint: string;
  private healthCheckInterval?: NodeJS.Timeout;
  private requestQueues: Map<string, PQueue> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number }> = new Map();
  private retryOptions: pRetry.Options;

  constructor(private config: ConnectionManagerConfig) {
    super();
    this.validateConfig(config);
    this.config = { ...DEFAULT_CONFIG, ...config } as ConnectionManagerConfig;
    this.currentEndpoint = this.config.defaultEndpoint || this.config.endpoints[0]?.url;
    this.retryOptions = {
      retries: this.config.maxRetries!,
      minTimeout: this.config.retryDelay!,
      maxTimeout: 10000,
      onFailedAttempt: (error: any) => {
        const endpoint = error.endpoint as string | undefined;
        if (endpoint) {
          this.recordFailure(endpoint, error);
        }
      },
    };

    this.initializeEndpoints();
    this.startHealthChecks();
  }

  private validateConfig(config: ConnectionManagerConfig) {
    const schema = z.object({
      endpoints: z.array(
        z.object({
          url: z.string().url(),
          weight: z.number().int().positive().optional(),
          timeout: z.number().int().positive().optional(),
          rateLimit: z
            .object({
              rps: z.number().int().positive(),
              burst: z.number().int().positive().optional(),
            })
            .optional(),
        })
      ).min(1, 'At least one endpoint is required'),
      defaultEndpoint: z.string().url().optional(),
      healthCheckInterval: z.number().int().positive().optional(),
      maxRetries: z.number().int().min(0).optional(),
      retryDelay: z.number().int().positive().optional(),
      circuitBreaker: z
        .object({
          threshold: z.number().int().positive(),
          timeout: z.number().int().positive(),
        })
        .optional(),
      connectionConfig: z.any().optional(),
    });

    const result = schema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid connection config: ${result.error.message}`);
    }
  }

  private initializeEndpoints() {
    for (const endpoint of this.config.endpoints) {
      const connection = new Connection(endpoint.url, {
        commitment: 'confirmed',
        ...this.config.connectionConfig,
      });

      this.connections.set(endpoint.url, connection);
      this.healthStatus.set(endpoint.url, {
        url: endpoint.url,
        isHealthy: true,
        lastChecked: new Date(),
        latency: 0,
        stats: {
          totalRequests: 0,
          failedRequests: 0,
          successRate: 100,
        },
      });

      // Initialize rate limiting queue if configured
      if (endpoint.rateLimit) {
        const queue = new PQueue({
          interval: 1000,
          intervalCap: endpoint.rateLimit.rps,
          carryoverConcurrencyCount: true,
          ...(endpoint.rateLimit.burst && { concurrency: endpoint.rateLimit.burst }),
        });
        this.requestQueues.set(endpoint.url, queue);
      }

      // Initialize circuit breaker
      this.circuitBreakers.set(endpoint.url, { failures: 0, lastFailure: 0 });
    }
  }

  private startHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(
      () => this.checkEndpointsHealth(),
      this.config.healthCheckInterval
    );

    // Initial health check
    this.checkEndpointsHealth().catch(console.error);
  }

  private async checkEndpointsHealth() {
    const healthChecks = Array.from(this.connections.entries()).map(
      async ([url, connection]) => {
        const startTime = Date.now();
        let isHealthy = false;
        let latency = 0;
        let error: Error | undefined;

        try {
          // Use getSlot as a lightweight health check
          await connection.getSlot();
          latency = Date.now() - startTime;
          isHealthy = true;
        } catch (err) {
          error = err as Error;
          isHealthy = false;
        }

        const health: EndpointHealth = {
          url,
          isHealthy,
          lastChecked: new Date(),
          latency,
          error,
          stats: {
            ...(this.healthStatus.get(url)?.stats || {
              totalRequests: 0,
              failedRequests: 0,
              successRate: 100,
            }),
          },
        };

        this.healthStatus.set(url, health);
        return health;
      }
    );

    await Promise.all(healthChecks);
  }

  private recordSuccess(url: string) {
    const health = this.healthStatus.get(url);
    if (health) {
      health.stats.totalRequests++;
      health.stats.successRate =
        ((health.stats.totalRequests - health.stats.failedRequests) /
          health.stats.totalRequests) *
        100;
      this.healthStatus.set(url, health);
    }

    // Reset circuit breaker on success
    const circuit = this.circuitBreakers.get(url);
    if (circuit) {
      circuit.failures = 0;
    }
  }

  private recordFailure(url: string, error: Error) {
    const health = this.healthStatus.get(url);
    if (health) {
      health.stats.totalRequests++;
      health.stats.failedRequests++;
      health.stats.successRate =
        ((health.stats.totalRequests - health.stats.failedRequests) /
          health.stats.totalRequests) *
        100;
      health.isHealthy = false;
      health.error = error;
      this.healthStatus.set(url, health);
    }

    // Update circuit breaker
    const now = Date.now();
    const circuit = this.circuitBreakers.get(url) || { failures: 0, lastFailure: 0 };
    
    // Reset failure count if the last failure was long enough ago
    if (now - circuit.lastFailure > (this.config.circuitBreaker?.timeout || 0)) {
      circuit.failures = 0;
    }

    circuit.failures++;
    circuit.lastFailure = now;
    this.circuitBreakers.set(url, circuit);

    // Trip circuit if threshold is exceeded
    if (circuit.failures >= (this.config.circuitBreaker?.threshold || 5)) {
      this.switchToHealthyEndpoint(url);
    }
  }

  private switchToHealthyEndpoint(failedUrl: string) {
    const healthyEndpoints = Array.from(this.healthStatus.entries())
      .filter(([url, health]) => health.isHealthy && url !== failedUrl)
      .sort((a, b) => a[1].latency - b[1].latency);

    if (healthyEndpoints.length > 0) {
      this.currentEndpoint = healthyEndpoints[0][0];
      console.warn(`Switched to endpoint: ${this.currentEndpoint} due to failures on ${failedUrl}`);
    }
  }

  public async getConnection(): Promise<Connection> {
    const connection = this.connections.get(this.currentEndpoint);
    if (!connection) {
      throw new ConnectionError(
        'No healthy endpoints available',
        'NO_HEALTHY_ENDPOINTS',
        this.currentEndpoint
      );
    }

    // If there's a rate limit queue, use it
    const queue = this.requestQueues.get(this.currentEndpoint);
    if (queue) {
      return queue.add(() => this.executeWithRetry(connection), {
        throwOnTimeout: true,
      }) as Promise<Connection>;
    }

    return this.executeWithRetry(connection);
  }

  private async executeWithRetry(connection: Connection): Promise<Connection> {
    return pRetry(
      async () => {
        try {
          // Test the connection
          await connection.getEpochInfo();
          this.recordSuccess(connection.rpcEndpoint);
          return connection;
        } catch (error) {
          this.recordFailure(connection.rpcEndpoint, error as Error);
          throw error;
        }
      },
      {
        ...this.retryOptions,
        onFailedAttempt: (error) => {
          if (error.attemptNumber >= (this.config.maxRetries || 3)) {
            this.switchToHealthyEndpoint(connection.rpcEndpoint);
          }
          if (this.retryOptions.onFailedAttempt) {
            this.retryOptions.onFailedAttempt(error);
          }
        },
      }
    );
  }

  public getHealthyEndpoints(): EndpointHealth[] {
    return Array.from(this.healthStatus.values()).filter((h) => h.isHealthy);
  }

  public getCurrentEndpoint(): string {
    return this.currentEndpoint;
  }

  public switchEndpoint(url: string): void {
    if (!this.connections.has(url)) {
      throw new Error(`No endpoint configured with URL: ${url}`);
    }
    this.currentEndpoint = url;
  }

  public async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Clear all queues
    for (const queue of this.requestQueues.values()) {
      queue.clear();
      await queue.onIdle();
    }
    
    this.requestQueues.clear();
    this.connections.clear();
    this.healthStatus.clear();
    this.circuitBreakers.clear();
  }
}

// Factory function for easier usage
export function createConnectionManager(config: ConnectionManagerConfig): ConnectionManager {
  return new SolanaConnectionManager(config);
}
