import { create } from 'zustand'
import { RiskScore, SolanaTokenInfo } from '@sol-guard/types'

interface AppState {
  // UI State
  isLoading: boolean
  error: string | null
  
  // Token Analysis State
  currentToken: string | null
  tokenInfo: SolanaTokenInfo | null
  riskScore: RiskScore | null
  analysisHistory: RiskScore[]
  
  // User State
  isAuthenticated: boolean
  user: any | null
  
  // Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentToken: (token: string | null) => void
  setTokenInfo: (info: SolanaTokenInfo | null) => void
  setRiskScore: (score: RiskScore | null) => void
  addToHistory: (score: RiskScore) => void
  setAuthenticated: (authenticated: boolean) => void
  setUser: (user: any | null) => void
  clearError: () => void
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  isLoading: false,
  error: null,
  currentToken: null,
  tokenInfo: null,
  riskScore: null,
  analysisHistory: [],
  isAuthenticated: false,
  user: null,

  // Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  setCurrentToken: (token: string | null) => set({ currentToken: token }),
  
  setTokenInfo: (info: SolanaTokenInfo | null) => set({ tokenInfo: info }),
  
  setRiskScore: (score: RiskScore | null) => set({ riskScore: score }),
  
  addToHistory: (score: RiskScore) => {
    const { analysisHistory } = get()
    const newHistory = [score, ...analysisHistory.filter(s => s.tokenAddress !== score.tokenAddress)]
    set({ analysisHistory: newHistory.slice(0, 50) }) // Keep last 50 analyses
  },
  
  setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
  
  setUser: (user: any | null) => set({ user }),
  
  clearError: () => set({ error: null }),
  
  reset: () => set({
    isLoading: false,
    error: null,
    currentToken: null,
    tokenInfo: null,
    riskScore: null,
    analysisHistory: [],
    isAuthenticated: false,
    user: null,
  }),
}))
