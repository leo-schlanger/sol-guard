import { Pool } from 'pg';
import { config } from '../config';
import { RiskScore, RiskBreakdown } from '@sol-guard/types';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()
      
      // Initialize tables
      await this.initializeTables()
      
      console.log('✅ Database connection initialized')
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      throw error
    }
  }

  private async initializeTables(): Promise<void> {
    const createTablesQuery = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        subscription_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      );

      -- Risk scores table
      CREATE TABLE IF NOT EXISTS risk_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_address VARCHAR(44) NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
        level VARCHAR(20) NOT NULL,
        breakdown JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Audits table
      CREATE TABLE IF NOT EXISTS audits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        repository_url TEXT NOT NULL,
        branch VARCHAR(255) DEFAULT 'main',
        status VARCHAR(50) DEFAULT 'pending',
        vulnerabilities JSONB DEFAULT '[]',
        summary JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_risk_scores_token_address ON risk_scores(token_address);
      CREATE INDEX IF NOT EXISTS idx_risk_scores_created_at ON risk_scores(created_at);
      CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
      CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    `

    await this.pool.query(createTablesQuery)
  }

  async storeRiskScore(riskScore: RiskScore): Promise<void> {
    const query = `
      INSERT INTO risk_scores (token_address, score, level, breakdown)
      VALUES ($1, $2, $3, $4)
    `
    
    await this.pool.query(query, [
      riskScore.tokenAddress,
      riskScore.score,
      riskScore.level,
      JSON.stringify(riskScore.breakdown),
    ])
  }

  async createRiskScore(data: {
    tokenAddress: string;
    score: number;
    breakdown: RiskBreakdown;
  }): Promise<void> {
    const query = `
      INSERT INTO risk_scores (token_address, score, breakdown, created_at)
      VALUES ($1, $2, $3, NOW())
    `;

    await this.pool.query(query, [
      data.tokenAddress,
      data.score,
      JSON.stringify(data.breakdown)
    ]);
  }

  async getRiskScore(tokenAddress: string): Promise<RiskScore | null> {
    const query = `
      SELECT token_address, score, breakdown::jsonb, created_at
      FROM risk_scores
      WHERE token_address = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [tokenAddress]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      tokenAddress: row.token_address,
      score: row.score,
      breakdown: row.breakdown,
      timestamp: row.created_at.toISOString(),
      level: this.getRiskLevel(row.score)
    };
  }

  async getRiskScoreHistory(
    tokenAddress: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<{ score: number; timestamp: string; breakdown: RiskBreakdown }>> {
    const query = `
      SELECT score, created_at, breakdown::jsonb
      FROM risk_scores
      WHERE token_address = $1
      ORDER BY created_at DESC
      LIMIT $2
      OFFSET $3
    `;

    const result = await this.pool.query(query, [tokenAddress, limit, offset]);
    
    return result.rows.map(row => ({
      score: row.score,
      timestamp: row.created_at.toISOString(),
      breakdown: row.breakdown
    }));
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  async getUserById(id: string) {
    const query = 'SELECT * FROM users WHERE id = $1'
    const result = await this.pool.query(query, [id])
    return result.rows[0]
  }

  async getUserByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1'
    const result = await this.pool.query(query, [email])
    return result.rows[0]
  }

  async createUser(userData: {
    email: string
    passwordHash: string
    name: string
  }) {
    const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING *
    `
    
    const result = await this.pool.query(query, [
      userData.email,
      userData.passwordHash,
      userData.name,
    ])
    
    return result.rows[0]
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}
