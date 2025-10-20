// Tipos locais substituindo '@sol-guard/types'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskScoreOptions {
  includeHistory?: boolean;
}

export interface TokenInfo {
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  supply: number;
  [key: string]: any;
}

export interface StaticAnalysis {
  score: number;
  vulnerabilities: Array<any>;
  codeQuality: number;
  securityPatterns: Array<any>;
  timestamp: string;
  [key: string]: any;
}

export interface DynamicAnalysis {
  score: number;
  runtimeBehavior: Array<any>;
  gasUsage: {
    average: number;
    max: number;
    min: number;
    distribution: Array<any>;
    [key: string]: any;
  };
  executionPaths: Array<any>;
  timestamp: string;
  [key: string]: any;
}

export interface OnChainAnalysis {
  score: number;
  liquidity: any;
  holderDistribution: any;
  transactionHistory: any;
  contractInteractions: Array<any>;
  timestamp: string;
  [key: string]: any;
}

export interface RiskBreakdown {
  staticAnalysis: number;
  dynamicAnalysis: number;
  onChainAnalysis: number;
  details: {
    staticAnalysis: StaticAnalysis;
    dynamicAnalysis: DynamicAnalysis;
    onChainAnalysis: OnChainAnalysis;
  };
  [key: string]: any;
}

export interface RiskScore {
  score: number;
  level: RiskLevel;
  breakdown: RiskBreakdown;
  timestamp: string;
  tokenAddress: string;
}
import { DatabaseService } from './DatabaseService';
import { SolanaService } from './SolanaService';
export class RiskScoreService {
  private cache: Map<string, { value: RiskScore; timestamp: number }>;
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  
  constructor(
    private database: DatabaseService,
    private solana: SolanaService
  ) {
    this.cache = new Map();
  }

  async calculateRiskScore(
    tokenAddress: string,
    options: RiskScoreOptions = {}
  ): Promise<RiskScore> {
    try {
      // Check cache first
      const cached = this.cache.get(tokenAddress);
      const now = Date.now();
      
      if (cached && !options.includeHistory && (now - cached.timestamp) < this.CACHE_TTL) {
        return cached.value;
      }

      // Perform all analyses in parallel
      const [
        staticAnalysis,
        dynamicAnalysis,
        onChainAnalysis
      ] = await Promise.all([
        this.performStaticAnalysis(tokenAddress),
        this.performDynamicAnalysis(tokenAddress),
        this.performOnChainAnalysis(tokenAddress)
      ]);

      // Calculate total score with weighted components
      const totalScore = (
        staticAnalysis.score * 0.3 +    // Static analysis 30%
        dynamicAnalysis.score * 0.3 +   // Dynamic analysis 30%
        onChainAnalysis.score * 0.4     // On-chain analysis 40%
      );

      const level = this.getRiskLevel(totalScore);

      const riskScore: RiskScore = {
        score: Math.round(totalScore * 100) / 100,
        level,
        breakdown: {
          staticAnalysis: staticAnalysis.score,
          dynamicAnalysis: dynamicAnalysis.score,
          onChainAnalysis: onChainAnalysis.score,
          details: {
            staticAnalysis,
            dynamicAnalysis,
            onChainAnalysis,
          }
        },
        timestamp: new Date().toISOString(),
        tokenAddress
      };

      // Store in database if history is enabled
      if (options.includeHistory) {
        await this.storeRiskScoreHistory(tokenAddress, riskScore.breakdown);
      }

      // Cache the result with timestamp
      this.cache.set(tokenAddress, { value: riskScore, timestamp: Date.now() });
      
      // Enforce cache size limit
      if (this.cache.size > this.MAX_CACHE_SIZE) {
        const iterator = this.cache.keys();
        const firstKey = iterator.next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      return riskScore;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to calculate risk score: ${error.message}`);
      }
      throw new Error('Failed to calculate risk score: Unknown error');
    }
  }

  async getRiskScoreHistory(
    tokenAddress: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<RiskScore>> {
    try {
      const history = await this.database.getRiskScoreHistory(tokenAddress, limit, offset);
      return history as any;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get risk score history: ${error.message}`);
      }
      throw new Error('Failed to get risk score history: Unknown error');
    }
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private async performStaticAnalysis(tokenAddress: string): Promise<StaticAnalysis> {
    try {
      const programInfo = await this.solana.getTokenProgram(tokenAddress);
      
      return {
        score: this.calculateStaticScore(programInfo),
        vulnerabilities: [],
        codeQuality: programInfo.isVerified ? 90 : 50,
        securityPatterns: [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Static analysis failed: ${error.message}`);
      }
      throw new Error('Static analysis failed: Unknown error');
    }
  }

  private async performDynamicAnalysis(tokenAddress: string): Promise<DynamicAnalysis> {
    try {
      const tokenBehavior = await this.solana.getMarketBehavior(tokenAddress);
      
      return {
        score: this.calculateDynamicScore(tokenBehavior),
        runtimeBehavior: [],
        gasUsage: {
          average: tokenBehavior.averageGas || 0,
          max: tokenBehavior.maxGas || 0,
          min: tokenBehavior.minGas || 0,
          distribution: []
        },
        executionPaths: [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Dynamic analysis failed: ${error.message}`);
      }
      throw new Error('Dynamic analysis failed: Unknown error');
    }
  }

  private async performOnChainAnalysis(tokenAddress: string): Promise<OnChainAnalysis> {
    try {
      // Get token info and perform analyses in parallel
      const [
        tokenInfo,
        liquidity,
        holderDistribution,
        transactionHistory
      ] = await Promise.all([
        this.solana.getTokenInfo(tokenAddress),
        this.analyzeLiquidity(tokenAddress),
        this.analyzeHolderDistribution(tokenAddress),
        this.analyzeTransactionHistory(tokenAddress)
      ]);

      const score = this.calculateOnChainScore(
        liquidity,
        holderDistribution,
        transactionHistory,
        tokenInfo
      );

      return {
        score,
        liquidity,
        holderDistribution,
        transactionHistory,
        contractInteractions: [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`On-chain analysis failed: ${error.message}`);
      }
      throw new Error('On-chain analysis failed: Unknown error');
    }
  }

  private async storeRiskScoreHistory(tokenAddress: string, breakdown: RiskBreakdown): Promise<void> {
    try {
      await this.database.storeRiskScore({
        tokenAddress,
        breakdown,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to store risk score history: ${error.message}`);
      }
      throw new Error('Failed to store risk score history: Unknown error');
    }
  }

  private calculateStaticScore(programInfo: any): number {
    let score = 100;
    
    if (!programInfo.isVerified) score -= 30;
    if (!programInfo.hasAudit) score -= 20;
    if (!programInfo.hasLockedUpgradeAuthority) score -= 20;
    
    return Math.max(0, score);
  }

  private calculateDynamicScore(tokenBehavior: any): number {
    let score = 100;
    
    if (tokenBehavior.priceVolatility > 0.5) score -= 30;
    if (tokenBehavior.abnormalTradingScore > 0.3) score -= 30;
    if (tokenBehavior.failedTransactions > 0.1) score -= 20;
    
    return Math.max(0, score);
  }

  private calculateOnChainScore(
    liquidity: any,
    holderDistribution: any,
    transactionHistory: any,
    tokenInfo: TokenInfo
  ): number {
    let score = 100;

    // Liquidity impact (30%)
    if (liquidity.liquidityRisk === 'critical') score -= 30;
    else if (liquidity.liquidityRisk === 'high') score -= 20;
    else if (liquidity.liquidityRisk === 'medium') score -= 10;

    // Holder distribution impact (30%)
    if (holderDistribution.concentration > 80) score -= 30;
    else if (holderDistribution.concentration > 60) score -= 20;
    else if (holderDistribution.concentration > 40) score -= 10;

    // Transaction history impact (30%)
    if (transactionHistory.risk === 'critical') score -= 30;
    else if (transactionHistory.risk === 'high') score -= 20;
    else if (transactionHistory.risk === 'medium') score -= 10;

    // Token maturity bonus (10%)
    if (tokenInfo.supply > 1000000000) score += 10;

    return Math.max(0, Math.min(100, score));
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
}
