import { SolanaService } from './SolanaService'
import { SolanaTokenInfo } from '@sol-guard/types'

export class TokenAnalysisService {
  constructor(private solana: SolanaService) {}

  async getTokenInfo(tokenAddress: string): Promise<SolanaTokenInfo> {
    return await this.solana.getTokenInfo(tokenAddress)
  }

  async validateTokenAddress(address: string): Promise<boolean> {
    return await this.solana.validateAddress(address)
  }

  async getTokenMetadata(tokenAddress: string) {
    return await this.solana.getTokenMetadata(tokenAddress)
  }

  async getTokenHolders(tokenAddress: string, limit: number = 100) {
    return await this.solana.getTokenHolders(tokenAddress, limit)
  }

  async getTokenTransactions(tokenAddress: string, limit: number = 100) {
    return await this.solana.getTokenTransactions(tokenAddress, limit)
  }
}
