import { PublicKey, Transaction, VersionedTransaction, SendOptions } from '@solana/web3.js';
import { WalletError, WalletNotConnectedError } from './errors';
import { 
  WalletName,
  WalletReadyState,
  SignerWalletAdapter,
  MessageSignerWalletAdapter,
  WalletAdapterNetwork
} from './types';

export interface WalletAdapterEvents {
  connect(publicKey: PublicKey): void;
  disconnect(): void;
  error(error: WalletError): void;
  readyStateChange(readyState: WalletReadyState): void;
}

export interface BaseWalletAdapter {
  readonly name: WalletName;
  readonly url: string;
  readonly icon: string;
  readonly readyState: WalletReadyState;
  readonly publicKey: PublicKey | null;
  readonly connecting: boolean;
  readonly connected: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
}

export abstract class BaseMessageSignerWalletAdapter extends MessageSignerWalletAdapter {
  abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
}

export class WalletNotInitializedError extends WalletError {
  name = 'WalletNotInitializedError';
  constructor() {
    super('Wallet not initialized');
  }
}

export interface WalletAdapterProps {
  wallets: BaseWalletAdapter[];
  autoConnect?: boolean;
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
}

/**
 * Configuration options for wallet adapter
 */
export interface WalletAdapterConfig {
  network?: WalletAdapterNetwork;
  autoConnect?: boolean;
  walletPrecedence?: WalletName[];
  localStorageKey?: string;
  addressLookupTableAccounts?: PublicKey[];
}

/**
 * Options for sending a transaction
 */
export interface SendTransactionOptions extends Omit<SendOptions, 'preflightCommitment'> {
  maxRetries?: number;
  minContextSlot?: number;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}