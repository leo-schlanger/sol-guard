export interface RiskFactors {
  liquidity: number;
  holders: number;
  programSecurity: number;
  marketBehavior: number;
}

export interface RiskBreakdown {
  totalScore: number;
  factors: RiskFactors;
  timestamp: string;
  details?: {
    liquidityAnalysis?: {
      totalLiquidity: number;
      stabilityScore: number;
      details: string[];
    };
    holderAnalysis?: {
      uniqueHolders: number;
      giniCoefficient: number;
      details: string[];
    };
    programAnalysis?: {
      auditStatus: string;
      verificationStatus: string;
      details: string[];
    };
    marketAnalysis?: {
      priceVolatility: number;
      tradingPatterns: string[];
      details: string[];
    };
  };
}

export interface RiskScore {
  score: number;
  breakdown: RiskBreakdown;
  level: RiskLevel;
  timestamp: string;
  tokenAddress: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TokenLiquidity {
  totalLiquidity: number;
  lastWeekStability: number;
  liquidityPools: Array<{
    pool: string;
    liquidity: number;
  }>;
}

export interface TokenHolders {
  uniqueHolders: number;
  giniCoefficient: number;
  holders: Array<{
    address: string;
    balance: string;
    percentage: number;
  }>;
}

export interface TokenProgram {
  isVerified: boolean;
  hasAudit: boolean;
  hasLockedUpgradeAuthority: boolean;
  upgradeAuthority?: string;
  programData: {
    lastDeployment: string;
    version: string;
  };
}

export interface MarketBehavior {
  priceVolatility: number;
  abnormalTradingScore: number;
  lastTradeTime: string;
  volume24h: number;
  priceChange24h: number;
}

export interface RiskScoreOptions {
  includeHistory?: boolean;
  includeDetailedReport?: boolean;
  customWeights?: {
    liquidity?: number;
    holders?: number;
    programSecurity?: number;
    marketBehavior?: number;
  };
}

export interface RiskScoreHistory {
  tokenAddress: string;
  scores: Array<{
    score: number;
    timestamp: string;
    breakdown: RiskBreakdown;
  }>;
}
