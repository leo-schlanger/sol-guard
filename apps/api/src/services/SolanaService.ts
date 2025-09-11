import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js'
import { config } from '../config'
import { SolanaTokenInfo, TokenMetadata } from '@sol-guard/types'

export class SolanaService {
  private connection: Connection
  private devnetConnection: Connection
  private testnetConnection: Connection

  constructor() {
    this.connection = new Connection(config.SOLANA_RPC_URL, 'confirmed')
    this.devnetConnection = new Connection(config.SOLANA_RPC_URL_DEVNET, 'confirmed')
    this.testnetConnection = new Connection(config.SOLANA_RPC_URL_TESTNET, 'confirmed')
  }

  async initialize(): Promise<void> {
    try {
      // Test connections
      await Promise.all([
        this.connection.getVersion(),
        this.devnetConnection.getVersion(),
        this.testnetConnection.getVersion(),
      ])
      console.log('✅ Solana RPC connections initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Solana connections:', error)
      throw error
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<SolanaTokenInfo> {
    try {
      const publicKey = new PublicKey(tokenAddress)
      
      // Get account info
      const accountInfo = await this.connection.getAccountInfo(publicKey)
      
      if (!accountInfo) {
        throw new Error('Token account not found')
      }

      // Get token supply
      const supply = await this.connection.getTokenSupply(publicKey)
      
      // Get token metadata
      const metadata = await this.getTokenMetadata(tokenAddress)

      // Parse mint account data to get authorities
      const mintInfo = await this.parseMintAccount(accountInfo.data)

      return {
        address: tokenAddress,
        name: metadata?.name || 'Unknown Token',
        symbol: metadata?.symbol || 'UNK',
        decimals: supply.value.decimals,
        supply: parseInt(supply.value.amount),
        mintAuthority: mintInfo.mintAuthority,
        freezeAuthority: mintInfo.freezeAuthority,
        metadata,
      }
    } catch (error) {
      throw new Error(`Failed to get token info: ${error.message}`)
    }
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
    try {
      // Try to get metadata from Metaplex
      const metadata = await this.getMetaplexMetadata(tokenAddress)
      if (metadata) return metadata

      // Fallback to known token metadata
      return this.getKnownTokenMetadata(tokenAddress)
    } catch (error) {
      console.warn(`Failed to get metadata for token ${tokenAddress}:`, error)
      return null
    }
  }

  private async getMetaplexMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
    try {
      // This would integrate with Metaplex metadata program
      // For now, return null to use fallback
      return null
    } catch (error) {
      return null
    }
  }

  private getKnownTokenMetadata(tokenAddress: string): TokenMetadata | null {
    // Known token metadata for popular Solana tokens
    const knownTokens: Record<string, TokenMetadata> = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
        name: 'USD Coin',
        symbol: 'USDC',
        description: 'USD Coin (USDC) is a fully-backed U.S. dollar stablecoin.',
        image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        attributes: [],
      },
      'So11111111111111111111111111111111111111112': {
        name: 'Wrapped SOL',
        symbol: 'SOL',
        description: 'Wrapped SOL (WSOL) is the wrapped version of Solana native token.',
        image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        attributes: [],
      },
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
        name: 'Bonk',
        symbol: 'BONK',
        description: 'Bonk is a community dog coin for the people, by the people.',
        image: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
        attributes: [],
      },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
        name: 'Tether USD',
        symbol: 'USDT',
        description: 'Tether gives you the joint benefits of open blockchain technology and traditional currency.',
        image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
        attributes: [],
      },
    }

    return knownTokens[tokenAddress] || null
  }

  private async parseMintAccount(data: Buffer): Promise<{
    mintAuthority: string | null
    freezeAuthority: string | null
  }> {
    try {
      // Parse mint account data (simplified version)
      // In a real implementation, this would properly parse the mint account structure
      return {
        mintAuthority: null,
        freezeAuthority: null,
      }
    } catch (error) {
      return {
        mintAuthority: null,
        freezeAuthority: null,
      }
    }
  }

  async getTokenHolders(tokenAddress: string, limit: number = 100) {
    try {
      const mintPublicKey = new PublicKey(tokenAddress)
      
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program ID
        {
          filters: [
            {
              dataSize: 165, // Token account data size
            },
            {
              memcmp: {
                offset: 0, // Mint address offset
                bytes: mintPublicKey.toBase58(),
              },
            },
          ],
        }
      )

      // Parse token accounts and get balances
      const holders = []
      for (const account of tokenAccounts.slice(0, limit)) {
        try {
          const accountInfo = await this.connection.getAccountInfo(account.pubkey)
          if (accountInfo) {
            // Parse token account data (simplified)
            const balance = await this.connection.getTokenAccountBalance(account.pubkey)
            if (balance.value.uiAmount && balance.value.uiAmount > 0) {
              holders.push({
                address: account.pubkey.toBase58(),
                balance: balance.value.uiAmount,
                rawBalance: balance.value.amount,
                decimals: balance.value.decimals,
              })
            }
          }
        } catch (error) {
          // Skip invalid accounts
          continue
        }
      }

      // Sort by balance descending
      holders.sort((a, b) => b.balance - a.balance)
      
      return holders
    } catch (error) {
      throw new Error(`Failed to get token holders: ${error.message}`)
    }
  }

  async getTokenTransactions(tokenAddress: string, limit: number = 100) {
    try {
      const mintPublicKey = new PublicKey(tokenAddress)
      
      // Get recent transactions involving this token
      const signatures = await this.connection.getSignaturesForAddress(mintPublicKey, {
        limit,
      })

      const transactions = []
      for (const signature of signatures) {
        try {
          const transaction = await this.connection.getTransaction(signature.signature, {
            maxSupportedTransactionVersion: 0,
          })
          
          if (transaction) {
            transactions.push({
              signature: signature.signature,
              slot: transaction.slot,
              blockTime: transaction.blockTime,
              fee: transaction.meta?.fee || 0,
              success: transaction.meta?.err === null,
              preBalances: transaction.meta?.preBalances || [],
              postBalances: transaction.meta?.postBalances || [],
            })
          }
        } catch (error) {
          // Skip invalid transactions
          continue
        }
      }

      return transactions
    } catch (error) {
      throw new Error(`Failed to get token transactions: ${error.message}`)
    }
  }

  async getTokenLiquidity(tokenAddress: string) {
    try {
      // This would integrate with DEX APIs like Raydium, Orca, etc.
      // For now, return mock data
      return {
        totalLiquidity: 0,
        liquidityPools: [],
        liquidityRisk: 'medium' as const,
      }
    } catch (error) {
      throw new Error(`Failed to get token liquidity: ${error.message}`)
    }
  }

  async getConnection(network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet'): Promise<Connection> {
    switch (network) {
      case 'devnet':
        return this.devnetConnection
      case 'testnet':
        return this.testnetConnection
      default:
        return this.connection
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }
}
