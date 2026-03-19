import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',
  PORT: parseInt(process.env.PORT || '3001'),
  API_HOST: process.env.API_HOST || 'localhost:3001',
  
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
    // NOTE: OPENAI_API_KEY removed from required - using pattern-based analysis as fallback
    // TODO: [PREMIUM] Re-enable when AI features are monetized
    // 'OPENAI_API_KEY',
  ] as const

  for (const envVar of productionRequiredVars) {
    if (!config[envVar]) {
      throw new Error(`Missing required production environment variable: ${envVar}`)
    }
  }
}

// Feature flags for zero-budget mode
export const featureFlags = {
  // AI/ML Features - Disabled by default (require paid APIs)
  AI_ANALYSIS_ENABLED: !!config.OPENAI_API_KEY,
  VECTOR_DB_ENABLED: !!process.env.PINECONE_API_KEY,

  // Premium RPC Features - Disabled by default
  HELIUS_ENABLED: !!config.HELIUS_API_KEY,
  QUICKNODE_ENABLED: !!config.QUICKNODE_API_KEY,

  // Monitoring Features - Disabled by default
  SENTRY_ENABLED: !!config.SENTRY_DSN,
  DATADOG_ENABLED: !!config.DATADOG_API_KEY,

  // Certification Features - Mock mode by default
  REAL_NFT_MINTING: !!process.env.SOLGUARD_AUTHORITY_PRIVATE_KEY,

  // Notification Features - Disabled by default
  SLACK_ENABLED: !!process.env.SLACK_WEBHOOK_URL,
  EMAIL_ENABLED: !!process.env.SMTP_HOST,

  // Real-time monitoring limits (free tier)
  MAX_MONITORING_SUBSCRIPTIONS: 100,
} as const

// Log feature status on startup
if (config.NODE_ENV !== 'test') {
  console.log('📋 Feature Flags Status:')
  console.log(`   AI Analysis: ${featureFlags.AI_ANALYSIS_ENABLED ? '✅ Enabled' : '❌ Disabled (no OPENAI_API_KEY)'}`)
  console.log(`   Vector DB: ${featureFlags.VECTOR_DB_ENABLED ? '✅ Enabled' : '❌ Disabled (no PINECONE_API_KEY)'}`)
  console.log(`   Premium RPC: ${featureFlags.HELIUS_ENABLED || featureFlags.QUICKNODE_ENABLED ? '✅ Enabled' : '❌ Disabled (using free RPC)'}`)
  console.log(`   Real NFT Minting: ${featureFlags.REAL_NFT_MINTING ? '✅ Enabled' : '❌ Disabled (mock mode)'}`)
  console.log(`   Monitoring Limit: ${featureFlags.MAX_MONITORING_SUBSCRIPTIONS} subscriptions`)
}
