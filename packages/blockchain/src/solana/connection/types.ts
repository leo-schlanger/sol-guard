import { Connection, ConnectionConfig } from '@solana/web3.js';

export interface EndpointConfig {
  url: string;
  weight?: number;
  timeout?: number;
  rateLimit?: {
    rps: number;
    burst?: number;
  };
}

export interface ConnectionManagerConfig {
  endpoints: EndpointConfig[];
  defaultEndpoint?: string;
  healthCheckInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
  circuitBreaker?: {
    threshold: number;
    timeout: number;
  };
  connectionConfig?: ConnectionConfig;
}

export interface EndpointHealth {
  url: string;
  isHealthy: boolean;
  lastChecked: Date;
  latency: number;
  error?: Error;
  stats: {
    totalRequests: number;
    failedRequests: number;
    successRate: number;
  };
}

export interface ConnectionManager {
  getConnection(): Promise<Connection>;
  getHealthyEndpoints(): EndpointHealth[];
  getCurrentEndpoint(): string;
  switchEndpoint(url: string): void;
  close(): Promise<void>;
}

export class ConnectionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly endpoint: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ConnectionError';
  }
}
