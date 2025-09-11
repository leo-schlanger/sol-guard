import { RiskScore, RiskLevel, RiskBreakdown } from '@sol-guard/types'
import { DatabaseService } from './DatabaseService'
import { SolanaService } from './SolanaService'

export interface RiskScoreOptions {
  includeHistory?: boolean
  includeDetailedReport?: boolean
}

export interface RiskScoreHistoryOptions {
  limit: number
  offset: number
}

export class RiskScoreService {
  constructor(
    private database: DatabaseService,
    private solana: SolanaService
  ) {}

  async calculateRiskScore(
    tokenAddress: string,
    options: RiskScoreOptions = {}
  ): Promise<RiskScore> {
    const startTime = Date.now()

    try {
      // Get token information from Solana
      const tokenInfo = await this.solana.getTokenInfo(tokenAddress)
      
      // Perform static analysis (placeholder)
      const staticAnalysis = await this.performStaticAnalysis(tokenAddress)
      
      // Perform dynamic analysis (placeholder)
      const dynamicAnalysis = await this.performDynamicAnalysis(tokenAddress)
      
      // Perform on-chain analysis
      const onChainAnalysis = await this.performOnChainAnalysis(tokenAddress)

      // Calculate overall risk score
      const score = this.calculateOverallScore(
        staticAnalysis,
        dynamicAnalysis,
        onChainAnalysis
      )

      const level = this.getRiskLevel(score)

      const riskScore: RiskScore = {
        score,
        level,
        breakdown: {
          staticAnalysis: staticAnalysis.score,
          dynamicAnalysis: dynamicAnalysis.score,
          onChainAnalysis: onChainAnalysis.score,
          details: {
            staticAnalysis,
            dynamicAnalysis,
            onChainAnalysis,
          },
        },
        timestamp: new Date(),
        tokenAddress,
      }

      // Store in database
      await this.database.storeRiskScore(riskScore)

      return riskScore
    } catch (error) {
      throw new Error(`Failed to calculate risk score: ${error.message}`)
    }
  }

  async getRiskScoreHistory(
    tokenAddress: string,
    options: RiskScoreHistoryOptions
  ): Promise<RiskScore[]> {
    try {
      return await this.database.getRiskScoreHistory(tokenAddress, options)
    } catch (error) {
      throw new Error(`Failed to get risk score history: ${error.message}`)
    }
  }

  private async performStaticAnalysis(tokenAddress: string) {
    // Placeholder for static analysis
    // In a real implementation, this would analyze the smart contract code
    return {
      score: Math.floor(Math.random() * 100),
      vulnerabilities: [],
      codeQuality: Math.floor(Math.random() * 100),
      securityPatterns: [],
    }
  }

  private async performDynamicAnalysis(tokenAddress: string) {
    // Placeholder for dynamic analysis
    // In a real implementation, this would analyze runtime behavior
    return {
      score: Math.floor(Math.random() * 100),
      runtimeBehavior: [],
      gasUsage: {
        average: 0,
        max: 0,
        min: 0,
        distribution: [],
      },
      executionPaths: [],
    }
  }

  private async performOnChainAnalysis(tokenAddress: string) {
    try {
      // Get token metadata and basic info
      const tokenInfo = await this.solana.getTokenInfo(tokenAddress)
      
      // Analyze liquidity
      const liquidity = await this.analyzeLiquidity(tokenAddress)
      
      // Analyze holder distribution
      const holderDistribution = await this.analyzeHolderDistribution(tokenAddress)
      
      // Analyze transaction history
      const transactionHistory = await this.analyzeTransactionHistory(tokenAddress)

      // Calculate on-chain score based on multiple factors
      const score = this.calculateOnChainScore(liquidity, holderDistribution, transactionHistory, tokenInfo)

      return {
        score,
        liquidity,
        holderDistribution,
        transactionHistory,
        contractInteractions: [],
      }
    } catch (error) {
      throw new Error(`On-chain analysis failed: ${error.message}`)
    }
  }

  private async analyzeLiquidity(tokenAddress: string) {
    try {
      // Get liquidity data from Solana service
      const liquidityData = await this.solana.getTokenLiquidity(tokenAddress)
      
      // Calculate liquidity risk based on total liquidity
      let liquidityRisk: RiskLevel = 'critical'
      if (liquidityData.totalLiquidity > 1000000) {
        liquidityRisk = 'low'
      } else if (liquidityData.totalLiquidity > 100000) {
        liquidityRisk = 'medium'
      } else if (liquidityData.totalLiquidity > 10000) {
        liquidityRisk = 'high'
      }

      return {
        totalLiquidity: liquidityData.totalLiquidity,
        liquidityPools: liquidityData.liquidityPools,
        liquidityRisk,
      }
    } catch (error) {
      return {
        totalLiquidity: 0,
        liquidityPools: [],
        liquidityRisk: 'critical' as RiskLevel,
      }
    }
  }

  private async analyzeHolderDistribution(tokenAddress: string) {
    try {
      // Get token holders
      const holders = await this.solana.getTokenHolders(tokenAddress, 100)
      
      if (holders.length === 0) {
        return {
          totalHolders: 0,
          topHolders: [],
          distributionRisk: 'critical' as RiskLevel,
          concentration: 100,
        }
      }

      // Calculate concentration (percentage held by top 10 holders)
      const top10Holders = holders.slice(0, 10)
      const totalSupply = holders.reduce((sum, holder) => sum + holder.balance, 0)
      const top10Supply = top10Holders.reduce((sum, holder) => sum + holder.balance, 0)
      const concentration = totalSupply > 0 ? (top10Supply / totalSupply) * 100 : 100

      // Determine distribution risk
      let distributionRisk: RiskLevel = 'low'
      if (concentration > 80) {
        distributionRisk = 'critical'
      } else if (concentration > 60) {
        distributionRisk = 'high'
      } else if (concentration > 40) {
        distributionRisk = 'medium'
      }

      return {
        totalHolders: holders.length,
        topHolders: top10Holders.map(holder => ({
          address: holder.address,
          balance: holder.balance,
          percentage: (holder.balance / totalSupply) * 100,
          isContract: false, // Would need to check if address is a contract
        })),
        distributionRisk,
        concentration,
      }
    } catch (error) {
      return {
        totalHolders: 0,
        topHolders: [],
        distributionRisk: 'critical' as RiskLevel,
        concentration: 100,
      }
    }
  }

  private async analyzeTransactionHistory(tokenAddress: string) {
    try {
      // Get recent transactions
      const transactions = await this.solana.getTokenTransactions(tokenAddress, 100)
      
      if (transactions.length === 0) {
        return {
          totalTransactions: 0,
          volume24h: 0,
          averageTransactionSize: 0,
          suspiciousTransactions: [],
          risk: 'high' as RiskLevel,
        }
      }

      // Calculate transaction metrics
      const successfulTransactions = transactions.filter(tx => tx.success)
      const totalTransactions = transactions.length
      const successRate = totalTransactions > 0 ? (successfulTransactions.length / totalTransactions) * 100 : 0
      
      // Calculate volume (simplified - would need more sophisticated calculation)
      const volume24h = transactions.reduce((sum, tx) => sum + Math.abs(tx.fee), 0)
      const averageTransactionSize = volume24h / totalTransactions

      // Detect suspicious transactions
      const suspiciousTransactions = transactions.filter(tx => {
        // Simple heuristics for suspicious activity
        return !tx.success || tx.fee > 1000000 // High fee or failed transaction
      }).map(tx => ({
        signature: tx.signature,
        type: tx.success ? 'high-fee' : 'failed',
        amount: tx.fee,
        risk: 'medium' as RiskLevel,
        description: tx.success ? 'High transaction fee' : 'Failed transaction',
      }))

      // Determine transaction risk
      let risk: RiskLevel = 'low'
      if (successRate < 50) {
        risk = 'critical'
      } else if (successRate < 80) {
        risk = 'high'
      } else if (successRate < 95) {
        risk = 'medium'
      }

      return {
        totalTransactions,
        volume24h,
        averageTransactionSize,
        suspiciousTransactions,
        risk,
      }
    } catch (error) {
      return {
        totalTransactions: 0,
        volume24h: 0,
        averageTransactionSize: 0,
        suspiciousTransactions: [],
        risk: 'critical' as RiskLevel,
      }
    }
  }

  private calculateOnChainScore(
    liquidity: any,
    holderDistribution: any,
    transactionHistory: any,
    tokenInfo: any
  ): number {
    let score = 100

    // Deduct points based on liquidity risk
    switch (liquidity.liquidityRisk) {
      case 'critical': score -= 40; break
      case 'high': score -= 25; break
      case 'medium': score -= 15; break
      case 'low': score -= 5; break
    }

    // Deduct points based on holder concentration
    if (holderDistribution.concentration > 80) {
      score -= 30
    } else if (holderDistribution.concentration > 60) {
      score -= 20
    } else if (holderDistribution.concentration > 40) {
      score -= 10
    }

    // Deduct points based on transaction risk
    switch (transactionHistory.risk) {
      case 'critical': score -= 25; break
      case 'high': score -= 15; break
      case 'medium': score -= 10; break
      case 'low': score -= 5; break
    }

    // Bonus points for established tokens
    if (tokenInfo.supply > 1000000000) { // 1B+ supply
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }

  private calculateOverallScore(
    staticAnalysis: any,
    dynamicAnalysis: any,
    onChainAnalysis: any
  ): number {
    // Weighted average of the three analysis types
    const weights = {
      static: 0.4,
      dynamic: 0.3,
      onChain: 0.3,
    }

    return Math.round(
      staticAnalysis.score * weights.static +
      dynamicAnalysis.score * weights.dynamic +
      onChainAnalysis.score * weights.onChain
    )
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'low'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'high'
    return 'critical'
  }
}
