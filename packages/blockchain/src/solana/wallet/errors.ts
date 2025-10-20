export class WalletError extends Error {
  public error: any;

  constructor(message?: string, error?: any) {
    super(message);
    this.error = error;
  }
}

export class WalletNotConnectedError extends WalletError {
  name = 'WalletNotConnectedError';

  constructor() {
    super('Wallet not connected');
  }
}

export class WalletConnectionError extends WalletError {
  name = 'WalletConnectionError';
}

export class WalletDisconnectedError extends WalletError {
  name = 'WalletDisconnectedError';
}

export class WalletAccountError extends WalletError {
  name = 'WalletAccountError';
}

export class WalletPublicKeyError extends WalletError {
  name = 'WalletPublicKeyError';
}

export class WalletKeypairError extends WalletError {
  name = 'WalletKeypairError';
}

export class WalletSignTransactionError extends WalletError {
  name = 'WalletSignTransactionError';
}

export class WalletSignMessageError extends WalletError {
  name = 'WalletSignMessageError';
}

export class WalletTimeoutError extends WalletError {
  name = 'WalletTimeoutError';
}

export class WalletWindowBlockedError extends WalletError {
  name = 'WalletWindowBlockedError';
}

export class WalletWindowClosedError extends WalletError {
  name = 'WalletWindowClosedError';
}

export class WalletLoadError extends WalletError {
  name = 'WalletLoadError';
}