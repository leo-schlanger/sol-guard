import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { EventEmitter } from 'events';

export type WalletName = 'phantom' | 'solflare' | 'backpack' | 'ledger' | 'sollet' | 'glow' | 'torus' | 'slope' | 'exodus' | 'nightly' | 'coin98' | 'math' | 'tokenpocket' | 'clover' | 'safepal' | 'coinbase';

export interface WalletAdapterEvents {
  connect(publicKey: PublicKey): void;
  disconnect(): void;
  error(error: Error): void;
  readyStateChange(ready: boolean): void;
}

export interface WalletAdapterProps {
  name: WalletName;
  url: string;
  icon: string;
  readyState: WalletReadyState;
  publicKey: PublicKey | null;
  connecting: boolean;
  connected: boolean;
  autoConnect: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options?: { skipPreflight?: boolean; maxRetries?: number }
  ): Promise<string>; // Returns the transaction signature
}

export enum WalletReadyState {
  /**
   * User-installable wallets can typically be detected by scanning for an API
   * that they've injected into the global context. If such an API is present,
   * we consider the wallet to have been installed.
   */
  Installed = 'Installed',
  NotDetected = 'NotDetected',
  /**
   * Loaded: Loaded in the browser, but the wallet is not available for the current page.
   * This could be because the wallet is locked or the user has not connected it yet.
   */
  Loaded = 'Loaded',
  Unsupported = 'Unsupported',
}

export interface WalletAdapter<Name extends string = string> extends EventEmitter, WalletAdapterProps {
  name: Name;
  readyState: WalletReadyState;
  publicKey: PublicKey | null;
  connecting: boolean;
  connected: boolean;
  autoConnect: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options?: { skipPreflight?: boolean; maxRetries?: number }
  ): Promise<string>;
}

export interface WalletAdapterConstructor<Name extends string, T extends WalletAdapter> {
  new (config?: any): T;
  name: Name;
  icon: string;
  url: string;
}

export interface WalletAdapterStore {
  adapters: WalletAdapter[];
  connected: boolean;
  autoConnect: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  connectedAdapter: WalletAdapter | null;
  select(adapterName: string): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options?: { skipPreflight?: boolean; maxRetries?: number }
  ): Promise<string>;
}

export interface WalletAdapterNetwork {
  name: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet' | 'custom';
  endpoint: string;
  chainId?: number;
  wsEndpoint?: string;
}

export interface WalletAdapterConfig {
  network?: WalletAdapterNetwork;
  autoConnect?: boolean;
  localStorageKey?: string;
  onError?: (error: Error) => void;
  onConnect?: (publicKey: PublicKey) => void;
  onDisconnect?: () => void;
  onReadyStateChange?: (ready: boolean) => void;
}
