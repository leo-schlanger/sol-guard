import { Connection, ConnectionConfig, PublicKey, TransactionSignature, LogsCallback, TransactionConfirmationStatus } from '@solana/web3.js';
import { EventEmitter } from 'events';
import { z } from 'zod';
import LRU from 'lru-cache';
import pRetry from 'p-retry';
import PQueue from 'p-queue';

export interface TransactionMonitorConfig {
  maxConcurrent?: number;
  maxRetries?: number;
  retryDelay?: number;
  confirmationStrategy?: 'fast' | 'confirmed' | 'finalized';
}

export interface ProgramLogConfig {
  programId: string;
  subscriptionId?: number;
  parseFunction?: (logs: string[]) => any;
}

export class TransactionMonitor extends EventEmitter {
  private connection: Connection;
  private queue: PQueue;
  private subscriptions: Map<string, { signature: string; callback: LogsCallback }> = new Map();
  private programSubscriptions: Map<string, number> = new Map();
  private cache: LRU<string, any>;

  constructor(
    connection: Connection,
    private config: TransactionMonitorConfig = {}
  ) {
    super();
    this.connection = connection;
    this.queue = new PQueue({
      concurrency: config.maxConcurrent || 10
    });

    this.cache = new LRU({
      max: 1000,
      ttl: 1000 * 60 * 60 // 1 hour
    });
  }

  async monitorTransaction(
    signature: TransactionSignature,
    commitment: TransactionConfirmationStatus = 'confirmed'
  ): Promise<void> {
    await this.queue.add(async () => {
      try {
        const result = await pRetry(
          () => this.connection.confirmTransaction(signature, commitment),
          {
            retries: this.config.maxRetries || 3,
            minTimeout: this.config.retryDelay || 1000
          }
        );

        if (result.value.err) {
          this.emit('transactionError', { signature, error: result.value.err });
        } else {
          this.emit('transactionConfirmed', { signature, result: result.value });
        }
      } catch (error) {
        this.emit('transactionError', { signature, error });
      }
    });
  }

  subscribeToProgram(config: ProgramLogConfig): void {
    const programId = new PublicKey(config.programId);
    
    if (this.programSubscriptions.has(config.programId)) {
      return;
    }

    const subscriptionId = this.connection.onLogs(
      programId,
      (logs) => {
        try {
          const parsedLogs = config.parseFunction ? config.parseFunction(logs.logs) : logs;
          this.emit('programLog', { programId: config.programId, logs: parsedLogs });
          this.cache.set(`${config.programId}-${logs.signature}`, parsedLogs);
        } catch (error) {
          this.emit('programLogError', { programId: config.programId, error });
        }
      },
      'confirmed'
    );

    this.programSubscriptions.set(config.programId, subscriptionId);
  }

  unsubscribeFromProgram(programId: string): void {
    const subscriptionId = this.programSubscriptions.get(programId);
    if (subscriptionId) {
      this.connection.removeOnLogsListener(subscriptionId);
      this.programSubscriptions.delete(programId);
    }
  }

  async getParsedLogs(signature: string, programId: string): Promise<any | null> {
    return this.cache.get(`${programId}-${signature}`);
  }

  clearSubscriptions(): void {
    for (const [programId, subscriptionId] of this.programSubscriptions) {
      this.connection.removeOnLogsListener(subscriptionId);
    }
    this.programSubscriptions.clear();
  }
}