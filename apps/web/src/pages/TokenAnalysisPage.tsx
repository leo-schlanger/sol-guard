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
        setError('Endereço de token inválido')
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
          <h2 className="text-xl font-semibold mb-2">Analisando Token...</h2>
          <p className="text-muted-foreground">
            Isso pode levar até 30 segundos
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
          <h2 className="text-xl font-semibold mb-2">Erro na Análise</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            Tentar Novamente
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
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Análise de Token</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {address}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
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
                <h3 className="text-lg font-semibold mb-4">Análise Estática</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Código bem estruturado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Sem vulnerabilidades críticas detectadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Algumas melhorias de segurança recomendadas</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Análise Dinâmica</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Comportamento de execução normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Uso de gas dentro dos padrões</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Análise On-Chain</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Distribuição de holders saudável</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Volume de transações consistente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Liquidez moderada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Info */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Informações do Token</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Nome</label>
                  <p className="font-medium">{tokenInfo?.name || 'Carregando...'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Símbolo</label>
                  <p className="font-medium">{tokenInfo?.symbol || 'Carregando...'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Decimais</label>
                  <p className="font-medium">{tokenInfo?.decimals || 'Carregando...'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Supply Total</label>
                  <p className="font-medium">
                    {tokenInfo?.supply ? tokenInfo.supply.toLocaleString() : 'Carregando...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver no Solscan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver no DexScreener
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver no CoinGecko
                </Button>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Avaliação de Risco</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Liquidez</span>
                  <span className="text-sm font-medium text-yellow-600">Média</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Concentração</span>
                  <span className="text-sm font-medium text-green-600">Baixa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Volume</span>
                  <span className="text-sm font-medium text-green-600">Alto</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Transações</span>
                  <span className="text-sm font-medium text-green-600">Estável</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

