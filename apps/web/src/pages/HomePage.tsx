import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@sol-guard/ui'
import { Shield, Search, Zap, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { useTokenAnalysis } from '../hooks/useTokenAnalysis'

export const HomePage: React.FC = () => {
  const [searchAddress, setSearchAddress] = useState('')
  const navigate = useNavigate()
  const { validateTokenAddress } = useTokenAnalysis()

  const handleSearch = () => {
    const trimmedAddress = searchAddress.trim()
    if (trimmedAddress) {
      if (validateTokenAddress(trimmedAddress)) {
        navigate(`/analyze/${trimmedAddress}`)
      } else {
        // Show error for invalid address
        alert('Endereço de token inválido. Por favor, verifique o formato.')
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Proteja seus investimentos{' '}
              <span className="solana-gradient bg-clip-text text-transparent">
                Solana
              </span>{' '}
              com IA
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Análise de risco em tempo real, auditoria automatizada de smart contracts 
              e monitoramento proativo de ameaças para o ecossistema Solana.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Digite o endereço do token ou programa Solana..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="px-8">
                  Analisar
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Análise gratuita
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Resultados em 30s
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Sem cadastro
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher o SolGuard?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A plataforma mais completa de segurança para o ecossistema Solana
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-solana-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-solana-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Risk Score Instantâneo</h3>
              <p className="text-muted-foreground">
                Análise completa de 0-100 para qualquer token ou programa Solana em menos de 30 segundos.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-solana-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-solana-green" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Auditoria IA</h3>
              <p className="text-muted-foreground">
                Análise automatizada de smart contracts com relatórios detalhados e certificação on-chain.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Monitoramento 24/7</h3>
              <p className="text-muted-foreground">
                IA de inteligência de ameaças com alertas instantâneos para vulnerabilidades emergentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-solana-purple mb-2">50K+</div>
              <div className="text-muted-foreground">Tokens Analisados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-solana-green mb-2">99.9%</div>
              <div className="text-muted-foreground">Precisão da IA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-500 mb-2">15min</div>
              <div className="text-muted-foreground">Tempo de Auditoria</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-500 mb-2">24/7</div>
              <div className="text-muted-foreground">Monitoramento</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-solana-purple/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já protegem seus investimentos com o SolGuard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="solana" className="px-8">
              Começar Gratuitamente
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
