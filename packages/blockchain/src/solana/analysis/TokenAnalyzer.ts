import { PublicKey } from '@solana/web3.js';
import { SolanaConnectionManager } from '../connection/ConnectionManager';
import { z } from 'zod';
import { 
  TokenMetadata,
  TokenAnalysis,
  SuspiciousPattern,
  ContractAnalysis,
  RiskLevel,
  TokenMarketData,
  LiquidityData
} from './types';

const HELIUS_API_SCHEMA = z.object({
  apiKey: z.string(),
  endpoint: z.string().url().optional()
});

const JUPITER_API_SCHEMA = z.object({
  endpoint: z.string().url().optional()
});

const DEX_SCREENER_API_SCHEMA = z.object({
  apiKey: z.string().optional(),
  endpoint: z.string().url().optional()
});

export interface TokenAnalyzerConfig {
  helius?: z.infer<typeof HELIUS_API_SCHEMA>;
  jupiter?: z.infer<typeof JUPITER_API_SCHEMA>;
  dexScreener?: z.infer<typeof DEX_SCREENER_API_SCHEMA>;
  enableRealTimeMonitoring?: boolean;
  suspiciousPatternThresholds?: {
    liquidityRemovalThreshold: number;
    holderConcentrationThreshold: number;
    tradingVolumeAnomalyThreshold: number;
    maxSupplyThreshold: number;
    mintAuthorityRiskThreshold: number;
  };
}

export class TokenAnalyzer {
  private connectionManager: SolanaConnectionManager;
  private config: TokenAnalyzerConfig;
  private metadataCache: Map<string, TokenMetadata> = new Map();
  private analysisCache: Map<string, TokenAnalysis> = new Map();

  constructor(
    connectionManager: SolanaConnectionManager,
    config: TokenAnalyzerConfig
  ) {
    this.connectionManager = connectionManager;
    this.config = this.validateConfig(config);
  }

  private validateConfig(config: TokenAnalyzerConfig): TokenAnalyzerConfig {
    if (config.helius) {
      HELIUS_API_SCHEMA.parse(config.helius);
    }
    if (config.jupiter) {
      JUPITER_API_SCHEMA.parse(config.jupiter);
    }
    if (config.dexScreener) {
      DEX_SCREENER_API_SCHEMA.parse(config.dexScreener);
    }
    return config;
  }

  /**
   * Analisa um token completo, incluindo metadata, contrato e padrões suspeitos
   */
  async analyzeToken(tokenAddress: string): Promise<TokenAnalysis> {
    const cached = this.analysisCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutos de cache
      return cached;
    }

    const [metadata, marketData, contractAnalysis] = await Promise.all([
      this.getTokenMetadata(tokenAddress),
      this.getMarketData(tokenAddress),
      this.analyzeContract(tokenAddress)
    ]);

    const suspiciousPatterns = await this.detectSuspiciousPatterns(
      tokenAddress,
      metadata,
      marketData,
      contractAnalysis
    );

    const analysis: TokenAnalysis = {
      tokenAddress,
      metadata,
      marketData,
      contractAnalysis,
      suspiciousPatterns,
      riskLevel: this.calculateRiskLevel(suspiciousPatterns),
      timestamp: Date.now()
    };

    this.analysisCache.set(tokenAddress, analysis);
    return analysis;
  }

  /**
   * Obtém e faz parse da metadata do token
   */
  private async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    const cached = this.metadataCache.get(tokenAddress);
    if (cached) return cached;

    try {
      // Usar Helius API para metadata
      const response = await fetch(
        `${this.config.helius?.endpoint || 'https://api.helius.xyz/v0'}/token-metadata?api-key=${this.config.helius?.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mintAccounts: [tokenAddress] })
        }
      );

      const data = await response.json();
      const metadata = this.parseHeliusMetadata(data[0]);
      
      this.metadataCache.set(tokenAddress, metadata);
      return metadata;
    } catch (error) {
      console.error('Failed to fetch token metadata:', error);
      throw new Error('Failed to fetch token metadata');
    }
  }

  /**
   * Obtém dados de mercado do token
   */
  private async getMarketData(tokenAddress: string): Promise<TokenMarketData> {
    const [jupiterData, dexScreenerData] = await Promise.all([
      this.getJupiterData(tokenAddress),
      this.getDexScreenerData(tokenAddress)
    ]);

    return {
      price: dexScreenerData.price,
      volume24h: dexScreenerData.volume24h,
      liquidity: this.aggregateLiquidityData(jupiterData.liquidity, dexScreenerData.liquidity),
      priceChange24h: dexScreenerData.priceChange24h,
      totalSupply: jupiterData.totalSupply,
      marketCap: dexScreenerData.marketCap,
      holders: jupiterData.holders,
      pools: jupiterData.pools
    };
  }

  /**
   * Analisa o contrato do token
   */
  private async analyzeContract(tokenAddress: string): Promise<ContractAnalysis> {
    const connection = this.connectionManager.getCurrentConnection();
    const programId = new PublicKey(tokenAddress);

    try {
      const accountInfo = await connection.getAccountInfo(programId);
      if (!accountInfo?.data) {
        throw new Error('Contract data not found');
      }

      return {
        size: accountInfo.data.length,
        executable: accountInfo.executable,
        owner: accountInfo.owner.toString(),
        staticAnalysis: await this.performStaticAnalysis(accountInfo.data),
        permissions: await this.analyzePermissions(tokenAddress),
        upgradeAuthority: await this.getUpgradeAuthority(tokenAddress)
      };
    } catch (error) {
      console.error('Failed to analyze contract:', error);
      throw new Error('Failed to analyze contract');
    }
  }

  /**
   * Detecta padrões suspeitos no token
   */
  private async detectSuspiciousPatterns(
    tokenAddress: string,
    metadata: TokenMetadata,
    marketData: TokenMarketData,
    contractAnalysis: ContractAnalysis
  ): Promise<SuspiciousPattern[]> {
    const patterns: SuspiciousPattern[] = [];

    // Verificar concentração de holders
    if (this.isHolderConcentrationSuspicious(marketData.holders)) {
      patterns.push({
        type: 'HOLDER_CONCENTRATION',
        severity: 'HIGH',
        description: 'High concentration of tokens in few wallets',
        details: {
          topHoldersPercentage: marketData.holders.concentration,
          threshold: this.config.suspiciousPatternThresholds?.holderConcentrationThreshold
        }
      });
    }

    // Verificar anomalias de liquidez
    if (this.isLiquidityRemovalSuspicious(marketData.liquidity)) {
      patterns.push({
        type: 'LIQUIDITY_REMOVAL',
        severity: 'CRITICAL',
        description: 'Suspicious liquidity removal pattern detected',
        details: {
          liquidityChange: marketData.liquidity.change24h,
          threshold: this.config.suspiciousPatternThresholds?.liquidityRemovalThreshold
        }
      });
    }

    // Verificar permissões do contrato
    if (this.areContractPermissionsSuspicious(contractAnalysis)) {
      patterns.push({
        type: 'SUSPICIOUS_PERMISSIONS',
        severity: 'HIGH',
        description: 'Contract has suspicious permission configuration',
        details: {
          upgradeAuthority: contractAnalysis.upgradeAuthority,
          mintAuthority: contractAnalysis.permissions.mintAuthority
        }
      });
    }

    // Verificar anomalias de volume
    if (this.isTradingVolumeSuspicious(marketData)) {
      patterns.push({
        type: 'TRADING_VOLUME_ANOMALY',
        severity: 'MEDIUM',
        description: 'Unusual trading volume pattern detected',
        details: {
          volumeChange: marketData.volume24h,
          threshold: this.config.suspiciousPatternThresholds?.tradingVolumeAnomalyThreshold
        }
      });
    }

    return patterns;
  }

  private calculateRiskLevel(patterns: SuspiciousPattern[]): RiskLevel {
    const severityScores = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    const totalScore = patterns.reduce((score, pattern) => {
      return score + severityScores[pattern.severity];
    }, 0);

    if (totalScore >= 8) return 'CRITICAL';
    if (totalScore >= 5) return 'HIGH';
    if (totalScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  // Helpers para análise de padrões suspeitos
  private isHolderConcentrationSuspicious(holders: any): boolean {
    const threshold = this.config.suspiciousPatternThresholds?.holderConcentrationThreshold || 0.7;
    return holders.concentration > threshold;
  }

  private isLiquidityRemovalSuspicious(liquidity: LiquidityData): boolean {
    const threshold = this.config.suspiciousPatternThresholds?.liquidityRemovalThreshold || -0.3;
    return liquidity.change24h < threshold;
  }

  private areContractPermissionsSuspicious(analysis: ContractAnalysis): boolean {
    return !analysis.permissions.mintAuthority || analysis.upgradeAuthority !== null;
  }

  private isTradingVolumeSuspicious(marketData: TokenMarketData): boolean {
    const threshold = this.config.suspiciousPatternThresholds?.tradingVolumeAnomalyThreshold || 5;
    const volumeChange = marketData.volume24h / marketData.marketCap;
    return volumeChange > threshold;
  }

  // Métodos auxiliares para integração com APIs
  private async getJupiterData(tokenAddress: string): Promise<any> {
    // Implementação da integração com Jupiter
    return {};
  }

  private async getDexScreenerData(tokenAddress: string): Promise<any> {
    // Implementação da integração com DexScreener
    return {};
  }

  private async performStaticAnalysis(programData: Buffer): Promise<any> {
    // Implementação da análise estática
    return {};
  }

  private async analyzePermissions(tokenAddress: string): Promise<any> {
    // Implementação da análise de permissões
    return {};
  }

  private async getUpgradeAuthority(tokenAddress: string): Promise<string | null> {
    // Implementação para verificar upgrade authority
    return null;
  }

  private parseHeliusMetadata(data: any): TokenMetadata {
    // Implementação do parser de metadata
    return {} as TokenMetadata;
  }

  private aggregateLiquidityData(
    jupiterLiquidity: any,
    dexScreenerLiquidity: any
  ): LiquidityData {
    // Implementação da agregação de dados de liquidez
    return {} as LiquidityData;
  }
}