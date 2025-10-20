import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection } from '@solana/web3.js';
import { ConnectionManagerConfig } from './connection/types';
import { SolanaConnectionManager } from './connection/ConnectionManager';
import { WalletAdapterManager } from './wallet/WalletAdapterManager';
import { WalletAdapterConfig } from './wallet/types';

export interface SolanaSDKConfig {
  network: WalletAdapterNetwork;
  endpoints: Array<{
    url: string;
    weight?: number;
    timeout?: number;
    rateLimit?: {
      rps: number;
      burst?: number;
    };
  }>;
  defaultEndpoint?: string;
  wallets?: WalletAdapterConfig;
  connection?: Partial<ConnectionManagerConfig>;
}

export class SolanaSDK {
  public readonly connectionManager: SolanaConnectionManager;
  public readonly walletManager: WalletAdapterManager;
  private readonly config: SolanaSDKConfig;

  constructor(config: SolanaSDKConfig) {
    this.config = config;
    
    // Initialize connection manager
    this.connectionManager = new SolanaConnectionManager({
      endpoints: config.endpoints,
      defaultEndpoint: config.defaultEndpoint,
      ...config.connection,
    });

    // Initialize wallet adapter
    this.walletManager = new WalletAdapterManager({
      network: config.network,
      ...config.wallets,
    });

    // Forward relevant events
    this.connectionManager.on('transactionConfirmed', (data) => this.emit('transactionConfirmed', data));
    this.connectionManager.on('transactionError', (data) => this.emit('transactionError', data));
    this.connectionManager.on('programLog', (data) => this.emit('programLog', data));
    this.walletManager.on('connect', (publicKey) => this.emit('walletConnected', { publicKey }));
    this.walletManager.on('disconnect', () => this.emit('walletDisconnected'));
  }

  /**
   * Gets a connection to the current endpoint
   */
  getCurrentConnection(): Connection {
    return this.connectionManager.getCurrentConnection();
  }

  /**
   * Monitors a transaction across all endpoints until confirmation
   */
  async monitorTransaction(signature: string, confirmationStrategy: 'fast' | 'confirmed' | 'finalized' = 'confirmed'): Promise<void> {
    await this.connectionManager.monitorTransaction(signature, {
      confirmationStrategy,
    });
  }

  /**
   * Subscribes to program logs with optional parsing
   */
  subscribeToProgramLogs(programId: string, parseFunction?: (logs: string[]) => any): void {
    this.connectionManager.subscribeToProgram(programId, {
      parseFunction,
    });
  }

  /**
   * Unsubscribes from program logs
   */
  unsubscribeFromProgramLogs(programId: string): void {
    this.connectionManager.unsubscribeFromProgram(programId);
  }

  /**
   * Clean up resources and subscriptions
   */
  destroy(): void {
    this.connectionManager.clearSubscriptions();
    this.walletManager.disconnect();
  }

  private emit(event: string, data: any): void {
    this.connectionManager.emit(event, data);
  }
}