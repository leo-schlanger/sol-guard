export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  uri?: string;
  mintAuthority?: string;
  freezeAuthority?: string;
  attributes?: {
    [key: string]: string | number | boolean;
  };
  extensions?: {
    [key: string]: any;
  };
}

export interface LiquidityPool {
  address: string;
  dex: string;
  token0: string;
  token1: string;
  totalLiquidity: number;
  volume24h: number;
  fee: number;
}

export interface LiquidityData {
  totalLiquidity: number;
  pools: LiquidityPool[];
  change24h: number;
  distributionByDex: {
    [dex: string]: number;
  };
}

export interface HolderData {
  address: string;
  balance: string;
  percentage: number;
  isContract: boolean;
}

export interface TokenHolders {
  total: number;
  concentration: number; // Percentual nos top holders
  topHolders: HolderData[];
  distribution: {
    ranges: {
      range: string;
      count: number;
      totalBalance: string;
    }[];
  };
}

export interface TokenMarketData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  totalSupply: string;
  holders: TokenHolders;
  liquidity: LiquidityData;
  pools: LiquidityPool[];
}

export interface StaticAnalysisResult {
  instructions: {
    type: string;
    frequency: number;
    risk: RiskLevel;
  }[];
  dataAccess: {
    reads: string[];
    writes: string[];
  };
  controlFlow: {
    branches: number;
    complexity: number;
  };
  securityIssues: {
    severity: RiskLevel;
    type: string;
    description: string;
    location: string;
  }[];
}

export interface ContractPermissions {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  upgradeAuthority: string | null;
  admin: string | null;
  restrictedOperations: {
    operation: string;
    authority: string;
  }[];
}

export interface ContractAnalysis {
  size: number;
  executable: boolean;
  owner: string;
  staticAnalysis: StaticAnalysisResult;
  permissions: ContractPermissions;
  upgradeAuthority: string | null;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SuspiciousPattern {
  type: string;
  severity: RiskLevel;
  description: string;
  details: {
    [key: string]: any;
  };
}

export interface TokenAnalysis {
  tokenAddress: string;
  metadata: TokenMetadata;
  marketData: TokenMarketData;
  contractAnalysis: ContractAnalysis;
  suspiciousPatterns: SuspiciousPattern[];
  riskLevel: RiskLevel;
  timestamp: number;
}