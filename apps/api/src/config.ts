import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',
  PORT: parseInt(process.env.PORT || '3001'),
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/solguard',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Solana
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  SOLANA_RPC_URL_DEVNET: process.env.SOLANA_RPC_URL_DEVNET || 'https://api.devnet.solana.com',
  SOLANA_RPC_URL_TESTNET: process.env.SOLANA_RPC_URL_TESTNET || 'https://api.testnet.solana.com',
  
  // AI/ML
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // External APIs
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
  QUICKNODE_API_KEY: process.env.QUICKNODE_API_KEY || '',
  
  // Rate Limiting
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  
  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  DATADOG_API_KEY: process.env.DATADOG_API_KEY || '',
} as const

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
] as const

for (const envVar of requiredEnvVars) {
  if (!config[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Validate production environment variables
if (config.NODE_ENV === 'production') {
  const productionRequiredVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'OPENAI_API_KEY',
  ] as const
  
  for (const envVar of productionRequiredVars) {
    if (!config[envVar]) {
      throw new Error(`Missing required production environment variable: ${envVar}`)
    }
  }
}
