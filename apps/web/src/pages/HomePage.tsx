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
        alert('Invalid token address. Please check the format.')
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
              Protect your{' '}
              <span className="solana-gradient bg-clip-text text-transparent">
                Solana
              </span>{' '}
              investments with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Real-time risk analysis, automated smart contract auditing,
              and proactive threat monitoring for the Solana ecosystem.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Enter Solana token or program address..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="px-8">
                  Analyze
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Free analysis
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Results in 30s
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No signup required
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
              Why choose SolGuard?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The most comprehensive security platform for the Solana ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-solana-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-solana-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Risk Score</h3>
              <p className="text-muted-foreground">
                Complete 0-100 analysis for any Solana token or program in under 30 seconds.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-solana-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-solana-green" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Auditing</h3>
              <p className="text-muted-foreground">
                Automated smart contract analysis with detailed reports and on-chain certification.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Monitoring</h3>
              <p className="text-muted-foreground">
                AI-powered threat intelligence with instant alerts for emerging vulnerabilities.
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
              <div className="text-muted-foreground">Tokens Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-solana-green mb-2">99.9%</div>
              <div className="text-muted-foreground">AI Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-500 mb-2">15min</div>
              <div className="text-muted-foreground">Audit Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-500 mb-2">24/7</div>
              <div className="text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-solana-purple/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who already protect their investments with SolGuard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="solana" className="px-8" onClick={() => document.querySelector('input')?.focus()}>
              Start Free Analysis
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              View Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
