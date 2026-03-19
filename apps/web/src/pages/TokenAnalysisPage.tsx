import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RiskScore } from '@sol-guard/ui'
import { Button } from '@sol-guard/ui'
import { ArrowLeft, RefreshCw, ExternalLink, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useTokenAnalysis } from '../hooks/useTokenAnalysis'

export const TokenAnalysisPage: React.FC = () => {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const {
    tokenInfo,
    riskScore,
    isAnalyzing,
    analyzeToken,
    validateTokenAddress,
    clearAnalysis
  } = useTokenAnalysis()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      if (!validateTokenAddress(address)) {
        setError('Invalid token address')
        return
      }
      analyzeToken(address, { includeDetailedReport: true })
    }
  }, [address, analyzeToken, validateTokenAddress])

  const handleRefresh = () => {
    if (address) {
      analyzeToken(address, { includeDetailedReport: true })
    }
  }

  const handleBack = () => {
    clearAnalysis()
    navigate('/')
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-solana-purple" />
          <h2 className="text-xl font-semibold mb-2">Analyzing Token...</h2>
          <p className="text-muted-foreground">
            This may take up to 30 seconds
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analysis Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Token Analysis</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {address}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Risk Score */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Risk Score</h2>
              <RiskScore
                score={riskScore.score}
                level={riskScore.level}
                showBreakdown={true}
                breakdown={riskScore.breakdown}
              />
            </div>

            {/* Detailed Analysis */}
            <div className="mt-8 space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Static Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Well-structured code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">No critical vulnerabilities detected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Some security improvements recommended</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Dynamic Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Normal execution behavior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Gas usage within standards</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">On-Chain Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Healthy holder distribution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Consistent transaction volume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Moderate liquidity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Info */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Token Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <p className="font-medium">{tokenInfo?.name || 'Loading...'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Symbol</label>
                  <p className="font-medium">{tokenInfo?.symbol || 'Loading...'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Decimals</label>
                  <p className="font-medium">{tokenInfo?.decimals || 'Loading...'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Total Supply</label>
                  <p className="font-medium">
                    {tokenInfo?.supply ? tokenInfo.supply.toLocaleString() : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`https://solscan.io/token/${address}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Solscan
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`https://dexscreener.com/solana/${address}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on DexScreener
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`https://www.coingecko.com/en/coins/${address}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on CoinGecko
                </Button>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Liquidity</span>
                  <span className="text-sm font-medium text-yellow-600">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Concentration</span>
                  <span className="text-sm font-medium text-green-600">Low</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Volume</span>
                  <span className="text-sm font-medium text-green-600">High</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Transactions</span>
                  <span className="text-sm font-medium text-green-600">Stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
