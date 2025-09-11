import React from 'react'
import { Button } from '@sol-guard/ui'
import { Plus, History, Settings, BarChart3 } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Gerencie suas análises e auditorias
            </p>
          </div>
          <Button variant="solana">
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Análises Hoje</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <BarChart3 className="h-8 w-8 text-solana-purple" />
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Análises Total</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <History className="h-8 w-8 text-solana-green" />
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auditorias</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Salvos</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Plus className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Análises Recentes</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v</p>
                  <p className="text-sm text-muted-foreground">USDC</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">Score: 95</p>
                  <p className="text-xs text-muted-foreground">2 min atrás</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">So11111111111111111111111111111111111111112</p>
                  <p className="text-sm text-muted-foreground">SOL</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">Score: 98</p>
                  <p className="text-xs text-muted-foreground">5 min atrás</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</p>
                  <p className="text-sm text-muted-foreground">BONK</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-600">Score: 72</p>
                  <p className="text-xs text-muted-foreground">10 min atrás</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Auditorias em Andamento</h2>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">MyDeFi Project</h3>
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Em Progresso
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  github.com/mydefi/project
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-solana-purple h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">65% concluído</p>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">NFT Marketplace</h3>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    Concluído
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  github.com/nft/marketplace
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">100% concluído</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
