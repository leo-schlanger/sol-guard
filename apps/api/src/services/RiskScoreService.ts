import {
  RiskScore,
  RiskLevel,
  RiskBreakdown,
  RiskScoreOptions,
  RiskFactors,
  TokenLiquidity,
  TokenHolders,
  TokenProgram,
  MarketBehavior
} from '@sol-guard/types';
import { DatabaseService } from './DatabaseService';
import { SolanaService } from './SolanaService';
import { z } from 'zod';
import pRetry from 'p-retry';
import LRUCache from 'lru-cache';

const DEFAULT_WEIGHTS = {
  liquidity: 0.25,
  holders: 0.25,
  programSecurity: 0.25,
  marketBehavior: 0.25
};

export class RiskScoreService {
  private cache: LRUCache<string, RiskScore>;
  
  constructor(
    private database: DatabaseService,
    private solana: SolanaService
  ) {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5 // 5 minutes
    });
  }

  async calculateRiskScore(
    tokenAddress: string,
    options: RiskScoreOptions = {}
  ): Promise<RiskScore> {
    try {
      // Check cache first
      const cached = this.cache.get(tokenAddress);
      if (cached && !options.includeHistory) {
        return cached;
      }

      const [liquidityScore, holdersScore, programSecurityScore, marketBehaviorScore] = 
        await Promise.all([
          this.calculateLiquidityScore(tokenAddress),
          this.calculateHoldersScore(tokenAddress),
          this.calculateProgramSecurityScore(tokenAddress),
          this.calculateMarketBehaviorScore(tokenAddress)
        ]);

      const weights = options.customWeights || DEFAULT_WEIGHTS;
      
      const factors: RiskFactors = {
        liquidity: liquidityScore,
        holders: holdersScore,
        programSecurity: programSecurityScore,
        marketBehavior: marketBehaviorScore
      };

      const totalScore = 
        factors.liquidity * weights.liquidity +
        factors.holders * weights.holders +
        factors.programSecurity * weights.programSecurity +
        factors.marketBehavior * weights.marketBehavior;

      const riskScore: RiskScore = {
        score: Math.round(totalScore * 100) / 100,
        breakdown: {
          totalScore,
          factors,
          timestamp: new Date().toISOString()
        },
        level: this.getRiskLevel(totalScore),
        timestamp: new Date().toISOString(),
        tokenAddress
      };

      // Store risk score history if enabled
      if (options.includeHistory) {
        await this.storeRiskScoreHistory(tokenAddress, riskScore.breakdown);
      }

      // Cache the result
      this.cache.set(tokenAddress, riskScore);

      return riskScore;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to calculate risk score: ${error.message}`);
      }
      throw error;
    }
  }

  async getRiskScoreHistory(
    tokenAddress: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<{ score: number; timestamp: string; breakdown: RiskBreakdown }>> {
    try {
      const history = await this.database.riskScores.findMany({
        where: { tokenAddress },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      });

      return history.map(record => ({
        score: record.score,
        timestamp: record.timestamp,
        breakdown: JSON.parse(record.breakdown)
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get risk score history: ${error.message}`);
      }
      throw error;
    }
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  private async calculateLiquidityScore(tokenAddress: string): Promise<number> {
    const liquidityInfo = await pRetry(
      () => this.solana.getTokenLiquidity(tokenAddress),
      { retries: 3 }
    );

    // Score based on liquidity depth (60%) and stability (40%)
    const depthScore = Math.min(60, (liquidityInfo.totalLiquidity / 1000000) * 60);
    const stabilityScore = Math.min(40, (liquidityInfo.lastWeekStability / 100) * 40);

    return (depthScore + stabilityScore) / 100;
  }

  private async calculateHoldersScore(tokenAddress: string): Promise<number> {
    const holderInfo = await pRetry(
      () => this.solana.getTokenHolders(tokenAddress),
      { retries: 3 }
    );

    // Score based on holder distribution (40%) and count (60%)
    const distributionScore = Math.min(40, (1 - holderInfo.giniCoefficient) * 40);
    const countScore = Math.min(60, (Math.log10(holderInfo.uniqueHolders) / 4) * 60);

    return (distributionScore + countScore) / 100;
  }

  private async calculateProgramSecurityScore(tokenAddress: string): Promise<number> {
    const securityInfo = await pRetry(
      () => this.solana.getTokenProgram(tokenAddress),
      { retries: 3 }
    );

    let score = 0;

    // Verification status (40%)
    if (securityInfo.isVerified) score += 40;

    // Audit status (30%)
    if (securityInfo.hasAudit) score += 30;

    // Upgrade authority status (30%)
    if (securityInfo.hasLockedUpgradeAuthority) score += 30;

    return score / 100;
  }

  private async calculateMarketBehaviorScore(tokenAddress: string): Promise<number> {
    const marketInfo = await pRetry(
      () => this.solana.getMarketBehavior(tokenAddress),
      { retries: 3 }
    );

    // Score based on price stability (50%) and trading patterns (50%)
    const volatilityScore = Math.min(50, (1 - marketInfo.priceVolatility) * 50);
    const patternScore = Math.min(50, (1 - marketInfo.abnormalTradingScore) * 50);

    return (volatilityScore + patternScore) / 100;
  }

  private async storeRiskScoreHistory(tokenAddress: string, breakdown: RiskBreakdown): Promise<void> {
    const timestamp = new Date().toISOString();
    
    try {
      await this.database.riskScores.create({
        data: {
          tokenAddress,
          score: breakdown.totalScore,
          timestamp,
          breakdown: JSON.stringify(breakdown)
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to store risk score history: ${error.message}`);
      }
      throw error;
    }
  }

  async calculateRiskScore(
    tokenAddress: string,
    options: RiskScoreOptions = {}
  ): Promise<RiskScore> {
    try {
      // Check cache first
      const cached = this.cache.get(tokenAddress);
      if (cached && !options.includeHistory) {
        return cached;
      }

      const [liquidityScore, holdersScore, programSecurityScore, marketBehaviorScore] = 
        await Promise.all([
          this.calculateLiquidityScore(tokenAddress),
          this.calculateHoldersScore(tokenAddress),
          this.calculateProgramSecurityScore(tokenAddress),
          this.calculateMarketBehaviorScore(tokenAddress)
        ]);

      const weights = options.customWeights || DEFAULT_WEIGHTS;
      
      const factors: RiskFactors = {
        liquidity: liquidityScore,
        holders: holdersScore,
        programSecurity: programSecurityScore,
        marketBehavior: marketBehaviorScore
      };

      const totalScore = 
        factors.liquidity * weights.liquidity +
        factors.holders * weights.holders +
        factors.programSecurity * weights.programSecurity +
        factors.marketBehavior * weights.marketBehavior;

      const riskScore: RiskScore = {
        score: Math.round(totalScore * 100) / 100,
        breakdown: {
          totalScore,
          factors,
          timestamp: new Date().toISOString()
        },
        level: this.getRiskLevel(totalScore),
        timestamp: new Date().toISOString(),
        tokenAddress
      };
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

  private async calculateLiquidityScore(tokenAddress: string): Promise<number> {
    const liquidityInfo = await this.solana.getTokenLiquidity(tokenAddress);
    
    // Score based on liquidity depth and stability
    const depthScore = Math.min(25, (liquidityInfo.totalLiquidity / 1000000) * 25);
    const stabilityScore = Math.min(25, (liquidityInfo.lastWeekStability / 100) * 25);
    
    return (depthScore + stabilityScore) / 2;
  }

  private async calculateHoldersScore(tokenAddress: string): Promise<number> {
    const holderInfo = await this.solana.getTokenHolders(tokenAddress);
    
    // Score based on holder distribution and count
    const distributionScore = Math.min(25, (holderInfo.giniCoefficient) * 25);
    const countScore = Math.min(25, (Math.log10(holderInfo.uniqueHolders) / 4) * 25);
    
    return (distributionScore + countScore) / 2;
  }

  private async calculateProgramSecurityScore(tokenAddress: string): Promise<number> {
    const securityInfo = await this.solana.getTokenProgram(tokenAddress);
    
    // Score based on program verification and audit status
    const verificationScore = securityInfo.isVerified ? 25 : 0;
    const auditScore = securityInfo.hasAudit ? 25 : 0;
    const upgradeAuthorityScore = securityInfo.hasLockedUpgradeAuthority ? 25 : 0;
    
    return (verificationScore + auditScore + upgradeAuthorityScore) / 3;
  }

  private async calculateMarketBehaviorScore(tokenAddress: string): Promise<number> {
    const marketInfo = await this.solana.getMarketBehavior(tokenAddress);
    
    // Score based on price stability and trading patterns
    const priceStabilityScore = Math.min(25, (1 - marketInfo.priceVolatility) * 25);
    const tradingPatternScore = Math.min(25, (1 - marketInfo.abnormalTradingScore) * 25);
    
    return (priceStabilityScore + tradingPatternScore) / 2;
  }

  private async calculateOverallScore(
    tokenAddress: string,
    options: RiskScoreOptions = {}
  ): Promise<RiskScore> {
    const factors: RiskFactors = {
      liquidity: await this.calculateLiquidityScore(tokenAddress),
      holders: await this.calculateHoldersScore(tokenAddress),
      programSecurity: await this.calculateProgramSecurityScore(tokenAddress),
      marketBehavior: await this.calculateMarketBehaviorScore(tokenAddress)
    };

    const overallScore = (
      factors.liquidity +
      factors.holders +
      factors.programSecurity +
      factors.marketBehavior
    ) / 4;

    const breakdown: RiskBreakdown = {
      totalScore: overallScore,
      factors: {
        liquidity: factors.liquidity,
        holders: factors.holders,
        programSecurity: factors.programSecurity,
        marketBehavior: factors.marketBehavior
      },
      timestamp: new Date().toISOString()
    };

    // Store risk score history if enabled
    if (options.includeHistory) {
      await this.storeRiskScoreHistory(tokenAddress, breakdown);
    }

    return {
      score: overallScore,
      breakdown,
      level: this.getRiskLevel(overallScore),
      timestamp: new Date().toISOString(),
      tokenAddress
    };
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'low'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'high'
    return 'critical'
  }
}
