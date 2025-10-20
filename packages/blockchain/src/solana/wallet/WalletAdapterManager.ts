import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { WalletAdapter, WalletAdapterConfig, WalletAdapterEvents, WalletName, WalletReadyState } from './types';
import { WalletError, WalletNotConnectedError } from './errors';
import { EventEmitter } from 'events';

export class WalletAdapterManager extends EventEmitter implements WalletAdapter {
  private readonly wallets: Map<WalletName, WalletAdapter> = new Map();
  private activeWallet: WalletAdapter | null = null;
  private _connecting = false;
  private autoConnectTimeout: NodeJS.Timeout | null = null;

  constructor(private config: WalletAdapterConfig) {
    super();
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleReadyStateChange = this.handleReadyStateChange.bind(this);

    if (this.config.autoConnect) {
      this.autoConnectTimeout = setTimeout(() => this.autoConnect(), 1000);
    }
  }

  get name(): WalletName {
    return this.activeWallet?.name || 'Wallet Manager';
  }

  get url(): string {
    return this.activeWallet?.url || '';
  }

  get icon(): string {
    return this.activeWallet?.icon || '';
  }

  get publicKey(): PublicKey | null {
    return this.activeWallet?.publicKey || null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return !!this.activeWallet?.connected;
  }

  get readyState(): WalletReadyState {
    return this.activeWallet?.readyState || WalletReadyState.NotDetected;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;
      if (!this.activeWallet) throw new WalletNotConnectedError();

      this._connecting = true;

      if (this.activeWallet.readyState !== WalletReadyState.Installed) {
        throw new WalletError('Selected wallet is not installed');
      }

      await this.activeWallet.connect();
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this.activeWallet;
    if (wallet) {
      this.activeWallet = null;

      try {
        await wallet.disconnect();
      } catch (error: any) {
        this.emit('error', new WalletError('Failed to disconnect wallet', error));
      }
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      const wallet = this.activeWallet;
      if (!wallet) throw new WalletNotConnectedError();
      return await wallet.signTransaction(transaction);
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    try {
      const wallet = this.activeWallet;
      if (!wallet) throw new WalletNotConnectedError();
      return await wallet.signAllTransactions(transactions);
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  registerWallet(wallet: WalletAdapter): void {
    if (!this.wallets.has(wallet.name)) {
      wallet.on('connect', this.handleConnect);
      wallet.on('disconnect', this.handleDisconnect);
      wallet.on('error', this.handleError);
      wallet.on('readyStateChange', this.handleReadyStateChange);

      this.wallets.set(wallet.name, wallet);
    }
  }

  unregisterWallet(walletName: WalletName): void {
    const wallet = this.wallets.get(walletName);
    if (wallet) {
      wallet.off('connect', this.handleConnect);
      wallet.off('disconnect', this.handleDisconnect);
      wallet.off('error', this.handleError);
      wallet.off('readyStateChange', this.handleReadyStateChange);

      this.wallets.delete(walletName);
    }
  }

  private async autoConnect(): Promise<void> {
    const preferredWallet = this.getPreferredWallet();
    if (preferredWallet) {
      try {
        this.activeWallet = preferredWallet;
        await this.connect();
      } catch (error: any) {
        this.emit('error', new WalletError('Failed to auto-connect wallet', error));
      }
    }
  }

  private getPreferredWallet(): WalletAdapter | undefined {
    const { walletPrecedence, localStorageKey } = this.config;
    
    // Try to get last used wallet from local storage
    if (localStorageKey) {
      const lastWalletName = localStorage.getItem(localStorageKey);
      if (lastWalletName) {
        const wallet = this.wallets.get(lastWalletName);
        if (wallet?.readyState === WalletReadyState.Installed) {
          return wallet;
        }
      }
    }

    // Try wallets in precedence order
    if (walletPrecedence) {
      for (const name of walletPrecedence) {
        const wallet = this.wallets.get(name);
        if (wallet?.readyState === WalletReadyState.Installed) {
          return wallet;
        }
      }
    }

    // Fall back to first installed wallet
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.readyState === WalletReadyState.Installed
    );
  }

  private handleConnect(publicKey: PublicKey): void {
    if (this.config.localStorageKey && this.activeWallet) {
      localStorage.setItem(this.config.localStorageKey, this.activeWallet.name);
    }
    this.emit('connect', publicKey);
  }

  private handleDisconnect(): void {
    if (this.config.localStorageKey) {
      localStorage.removeItem(this.config.localStorageKey);
    }
    this.emit('disconnect');
  }

  private handleError(error: WalletError): void {
    this.emit('error', error);
  }

  private handleReadyStateChange(readyState: WalletReadyState): void {
    this.emit('readyStateChange', readyState);
  }
}

export function createWalletAdapter(config: WalletAdapterConfig): WalletAdapter {
  return new WalletAdapterManager(config);
}