import { PublicKey } from '@solana/web3.js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { 
  TokenMetadata, 
  TokenMarketData,
  LiquidityData,
  LiquidityPool,
  TokenHolders
} from './types';

export interface MarketDataProvider {
  getDexScreenerData(tokenAddress: string): Promise<{
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    pairs: Array<{
      pairAddress: string;
      dex: string;
      liquidity: number;
      volume24h: number;
    }>;
  }>;

  getJupiterData(tokenAddress: string): Promise<{
    routes: Array<{
      poolAddress: string;
      amountIn: string;
      amountOut: string;
      priceImpact: number;
    }>;
    marketData: {
      price: number;
      liquidityTotal: number;
      volume24h: number;
    };
  }>;

  getHeliusData(tokenAddress: string): Promise<{
    onChainMetadata: {
      metadata: any;
      supply: string;
      owners: Array<{
        address: string;
        amount: string;
      }>;
    };
    offChainMetadata: {
      attributes: Array<{
        trait_type: string;
        value: string;
      }>;
      description: string;
      image: string;
    };
  }>;
}

export class TokenMetadataParser {
  constructor(private marketDataProvider: MarketDataProvider) {}

  async parseTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    try {
      // Busca metadata do Helius
      const heliusData = await this.marketDataProvider.getHeliusData(tokenAddress);
      
      return {
        name: heliusData.onChainMetadata.metadata.data.name,
        symbol: heliusData.onChainMetadata.metadata.data.symbol,
        decimals: heliusData.onChainMetadata.metadata.data.decimals,
        totalSupply: heliusData.onChainMetadata.supply,
        uri: heliusData.onChainMetadata.metadata.data.uri,
        mintAuthority: heliusData.onChainMetadata.metadata.data.mintAuthority,
        freezeAuthority: heliusData.onChainMetadata.metadata.data.freezeAuthority,
        attributes: this.parseAttributes(heliusData.offChainMetadata.attributes),
        extensions: {
          description: heliusData.offChainMetadata.description,
          image: heliusData.offChainMetadata.image
        }
      };
    } catch (error) {
      console.error('Error parsing token metadata:', error);
      throw new Error('Failed to parse token metadata');
    }
  }

  async parseMarketData(tokenAddress: string): Promise<TokenMarketData> {
    try {
      // Busca dados do DexScreener e Jupiter em paralelo
      const [dexScreenerData, jupiterData] = await Promise.all([
        this.marketDataProvider.getDexScreenerData(tokenAddress),
        this.marketDataProvider.getJupiterData(tokenAddress)
      ]);

      // Dados do Helius para holders
      const heliusData = await this.marketDataProvider.getHeliusData(tokenAddress);

      const liquidity = this.aggregateLiquidityData(dexScreenerData, jupiterData);
      const holders = this.parseHoldersData(heliusData.onChainMetadata.owners);

      return {
        price: dexScreenerData.price,
        priceChange24h: dexScreenerData.priceChange24h,
        volume24h: Math.max(dexScreenerData.volume24h, jupiterData.marketData.volume24h),
        marketCap: dexScreenerData.marketCap,
        totalSupply: heliusData.onChainMetadata.supply,
        holders,
        liquidity,
        pools: this.parseLiquidityPools(dexScreenerData, jupiterData)
      };
    } catch (error) {
      console.error('Error parsing market data:', error);
      throw new Error('Failed to parse market data');
    }
  }

  private parseAttributes(attributes: Array<{ trait_type: string; value: string }>) {
    return attributes.reduce((acc, attr) => {
      acc[attr.trait_type] = attr.value;
      return acc;
    }, {} as { [key: string]: string });
  }

  private aggregateLiquidityData(
    dexScreenerData: any,
    jupiterData: any
  ): LiquidityData {
    const distributionByDex: { [dex: string]: number } = {};
    
    // Agregar liquidez por DEX
    dexScreenerData.pairs.forEach((pair: any) => {
      distributionByDex[pair.dex] = (distributionByDex[pair.dex] || 0) + pair.liquidity;
    });

    const totalLiquidity = Object.values(distributionByDex).reduce(
      (sum: number, value: number) => sum + value,
      0
    );

    return {
      totalLiquidity,
      pools: this.parseLiquidityPools(dexScreenerData, jupiterData),
      change24h: this.calculateLiquidityChange(dexScreenerData),
      distributionByDex
    };
  }

  private parseLiquidityPools(
    dexScreenerData: any,
    jupiterData: any
  ): LiquidityPool[] {
    const pools: LiquidityPool[] = [];

    // Adicionar pools do DexScreener
    dexScreenerData.pairs.forEach((pair: any) => {
      pools.push({
        address: pair.pairAddress,
        dex: pair.dex,
        token0: pair.token0Address,
        token1: pair.token1Address,
        totalLiquidity: pair.liquidity,
        volume24h: pair.volume24h,
        fee: 0 // Fee não disponível no DexScreener
      });
    });

    // Adicionar rotas do Jupiter que não estão no DexScreener
    jupiterData.routes.forEach((route: any) => {
      if (!pools.find(pool => pool.address === route.poolAddress)) {
        pools.push({
          address: route.poolAddress,
          dex: 'Unknown', // Jupiter não fornece nome do DEX
          token0: '', // Precisaria buscar esses dados
          token1: '',
          totalLiquidity: 0, // Precisaria calcular
          volume24h: 0,
          fee: 0
        });
      }
    });

    return pools;
  }

  private parseHoldersData(owners: Array<{ address: string; amount: string }>): TokenHolders {
    const sortedHolders = [...owners].sort(
      (a, b) => Number(b.amount) - Number(a.amount)
    );

    const totalSupply = owners.reduce(
      (sum, owner) => sum + Number(owner.amount),
      0
    );

    const topHolders = sortedHolders.slice(0, 10).map(holder => ({
      address: holder.address,
      balance: holder.amount,
      percentage: (Number(holder.amount) / totalSupply) * 100,
      isContract: false // Precisaria verificar se é um contrato
    }));

    const concentration = topHolders.reduce(
      (sum, holder) => sum + holder.percentage,
      0
    );

    // Criar ranges de distribuição
    const ranges = this.createHolderDistributionRanges(owners, totalSupply);

    return {
      total: owners.length,
      concentration,
      topHolders,
      distribution: {
        ranges
      }
    };
  }

  private createHolderDistributionRanges(
    owners: Array<{ address: string; amount: string }>,
    totalSupply: number
  ) {
    const ranges = [
      { min: 0, max: 0.1 },
      { min: 0.1, max: 1 },
      { min: 1, max: 5 },
      { min: 5, max: 10 },
      { min: 10, max: 100 }
    ];

    return ranges.map(({ min, max }) => {
      const holdersInRange = owners.filter(owner => {
        const percentage = (Number(owner.amount) / totalSupply) * 100;
        return percentage > min && percentage <= max;
      });

      const totalBalance = holdersInRange.reduce(
        (sum, owner) => sum + Number(owner.amount),
        0
      );

      return {
        range: `${min}%-${max}%`,
        count: holdersInRange.length,
        totalBalance: totalBalance.toString()
      };
    });
  }

  private calculateLiquidityChange(dexScreenerData: any): number {
    // Implementação do cálculo de mudança de liquidez
    return 0;
  }
}