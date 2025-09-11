import { RiskScore, TokenAnalysisResponse, SolanaTokenInfo } from '@sol-guard/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Token Analysis
  async analyzeToken(
    address: string,
    options: {
      includeHistory?: boolean
      includeDetailedReport?: boolean
    } = {}
  ): Promise<TokenAnalysisResponse> {
    return this.request<TokenAnalysisResponse>('/api/tokens/analyze', {
      method: 'POST',
      body: JSON.stringify({
        address,
        includeHistory: options.includeHistory || false,
        includeDetailedReport: options.includeDetailedReport || false,
      }),
    })
  }

  async getTokenInfo(address: string): Promise<{ success: boolean; data: SolanaTokenInfo }> {
    return this.request<{ success: boolean; data: SolanaTokenInfo }>(`/api/tokens/${address}`)
  }

  async getTokenHistory(
    address: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ success: boolean; data: RiskScore[] }> {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    
    const queryString = params.toString()
    const endpoint = `/api/tokens/${address}/history${queryString ? `?${queryString}` : ''}`
    
    return this.request<{ success: boolean; data: RiskScore[] }>(endpoint)
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }

  // Authentication (placeholder)
  async login(email: string, password: string): Promise<{ success: boolean; data?: any }> {
    return this.request<{ success: boolean; data?: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; data?: any }> {
    return this.request<{ success: boolean; data?: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  // User Management (placeholder)
  async getUserProfile(): Promise<{ success: boolean; data?: any }> {
    return this.request<{ success: boolean; data?: any }>('/api/users/profile')
  }

  async updateUserProfile(data: { name?: string; email?: string }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Audits (placeholder)
  async startAudit(data: {
    repositoryUrl: string
    branch?: string
    includeTests?: boolean
    customRules?: string[]
  }): Promise<{ success: boolean; data?: any }> {
    return this.request<{ success: boolean; data?: any }>('/api/audits/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAuditStatus(auditId: string): Promise<{ success: boolean; data?: any }> {
    return this.request<{ success: boolean; data?: any }>(`/api/audits/${auditId}`)
  }

  async listAudits(options: {
    limit?: number
    offset?: number
    status?: string
  } = {}): Promise<{ success: boolean; data?: any }> {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    if (options.status) params.append('status', options.status)
    
    const queryString = params.toString()
    const endpoint = `/api/audits${queryString ? `?${queryString}` : ''}`
    
    return this.request<{ success: boolean; data?: any }>(endpoint)
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()
export default apiClient
