import { PublicKey } from '@solana/web3.js'

export interface WalletInfo {
  publicKey: PublicKey
  connected: boolean
  connecting: boolean
  disconnecting: boolean
}

export interface WalletAdapter {
  name: string
  url: string
  icon: string
  readyState: WalletReadyState
  publicKey: PublicKey | null
  connecting: boolean
  connected: boolean
  connect(): Promise<void>
  disconnect(): Promise<void>
  signTransaction<T extends Transaction>(transaction: T): Promise<T>
  signAllTransactions<T extends Transaction>(transactions: T[]): Promise<T[]>
  signMessage(message: Uint8Array): Promise<Uint8Array>
}

export enum WalletReadyState {
  Installed = 'Installed',
  NotDetected = 'NotDetected',
  Loadable = 'Loadable',
  Unsupported = 'Unsupported'
}

export interface Transaction {
  signatures: string[]
  message: any
}

export interface WalletContextState {
  wallets: WalletAdapter[]
  wallet: WalletAdapter | null
  publicKey: PublicKey | null
  connecting: boolean
  connected: boolean
  disconnecting: boolean
  select: (walletName: string) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}
