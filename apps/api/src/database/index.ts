import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { 
  pgTable,
  serial,
  text,
  timestamp,
  decimal,
  json,
  boolean 
} from 'drizzle-orm/pg-core';

// Define the schema
export const riskScores = pgTable('risk_scores', {
  id: serial('id').primaryKey(),
  tokenAddress: text('token_address').notNull(),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  breakdown: json('breakdown').notNull()
});

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at')
});

export const apiUsage = pgTable('api_usage', {
  id: serial('id').primaryKey(),
  apiKeyId: text('api_key_id').notNull(),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow()
});

// Database service
export class DatabaseService {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool);
  }

  get riskScores() {
    return this.db.query.riskScores;
  }

  get apiKeys() {
    return this.db.query.apiKeys;
  }

  get apiUsage() {
    return this.db.query.apiUsage;
  }

  async disconnect() {
    await this.pool.end();
  }
}
