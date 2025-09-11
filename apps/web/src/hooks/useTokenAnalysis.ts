import { useState, useCallback } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { apiClient } from '../services/api'
import { RiskScore, SolanaTokenInfo } from '@sol-guard/types'

export const useTokenAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const {
    currentToken,
    tokenInfo,
    riskScore,
    analysisHistory,
    setLoading,
    setError,
    setCurrentToken,
    setTokenInfo,
    setRiskScore,
    addToHistory,
    clearError,
  } = useAppStore()

  const analyzeToken = useCallback(async (
    tokenAddress: string,
    options: {
      includeHistory?: boolean
      includeDetailedReport?: boolean
    } = {}
  ) => {
    if (!tokenAddress.trim()) {
      setError('Token address is required')
      return null
    }

    setIsAnalyzing(true)
    setLoading(true)
    setError(null)
    setCurrentToken(tokenAddress)

    try {
      // Analyze token
      const analysisResponse = await apiClient.analyzeToken(tokenAddress, options)
      
      if (!analysisResponse.success || !analysisResponse.data) {
        throw new Error(analysisResponse.error || 'Failed to analyze token')
      }

      const newRiskScore = analysisResponse.data
      setRiskScore(newRiskScore)
      addToHistory(newRiskScore)

      // Get token info
      try {
        const tokenInfoResponse = await apiClient.getTokenInfo(tokenAddress)
        if (tokenInfoResponse.success && tokenInfoResponse.data) {
          setTokenInfo(tokenInfoResponse.data)
        }
      } catch (error) {
        console.warn('Failed to get token info:', error)
        // Don't fail the entire analysis if token info fails
      }

      return newRiskScore
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsAnalyzing(false)
      setLoading(false)
    }
  }, [setLoading, setError, setCurrentToken, setTokenInfo, setRiskScore, addToHistory])

  const getTokenHistory = useCallback(async (
    tokenAddress: string,
    options: { limit?: number; offset?: number } = {}
  ) => {
    try {
      const response = await apiClient.getTokenHistory(tokenAddress, options)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to get token history:', error)
      return []
    }
  }, [])

  const validateTokenAddress = useCallback((address: string): boolean => {
    // Basic Solana address validation
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    return solanaAddressRegex.test(address)
  }, [])

  const clearAnalysis = useCallback(() => {
    setCurrentToken(null)
    setTokenInfo(null)
    setRiskScore(null)
    clearError()
  }, [setCurrentToken, setTokenInfo, setRiskScore, clearError])

  return {
    // State
    currentToken,
    tokenInfo,
    riskScore,
    analysisHistory,
    isAnalyzing,
    
    // Actions
    analyzeToken,
    getTokenHistory,
    validateTokenAddress,
    clearAnalysis,
  }
}
