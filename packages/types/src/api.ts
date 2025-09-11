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
