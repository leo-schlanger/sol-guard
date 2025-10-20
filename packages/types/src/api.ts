// API Configuration Types
export interface ApiConfig {
  baseUrl: string
  timeout: number
  retries: number
  headers: Record<string, string>
}

// Request/Response Types
export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp: string
  requestId: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
  stack?: string
}

// Rate Limiting Types
export interface RateLimit {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// WebSocket Types
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp: string
  id: string
}

export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

// Authentication Types
export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresAt: number
  tokenType: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

// Error Types
export class ApiException extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

export class NetworkException extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'NetworkException'
  }
}

export class ValidationException extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationException'
  }
}

// Risk Score Types
export interface RiskFactors {
  liquidity: number
  holders: number
  programSecurity: number
  marketBehavior: number
}

export interface RiskBreakdown {
  totalScore: number
  factors: RiskFactors
  timestamp: string
}

export interface RiskScore {
  score: number
  breakdown: RiskBreakdown
  level: RiskLevel
  timestamp: string
  tokenAddress: string
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Token Analysis Types
export interface TokenLiquidity {
  totalLiquidity: number
  lastWeekStability: number
  liquidityPools: Array<{
    pool: string
    liquidity: number
  }>
}

export interface TokenHolders {
  uniqueHolders: number
  giniCoefficient: number
  holders: Array<{
    address: string
    balance: string
    percentage: number
  }>
}

export interface TokenProgram {
  isVerified: boolean
  hasAudit: boolean
  hasLockedUpgradeAuthority: boolean
  upgradeAuthority?: string
  programData: {
    lastDeployment: string
    version: string
  }
}

export interface MarketBehavior {
  priceVolatility: number
  abnormalTradingScore: number
  lastTradeTime: string
  volume24h: number
  priceChange24h: number
}
