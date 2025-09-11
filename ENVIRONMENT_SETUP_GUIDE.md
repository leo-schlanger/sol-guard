# 🔧 SolGuard Advanced Features - Environment Setup Guide

## 📋 Overview

This guide will help you configure all the environment variables needed for SolGuard Advanced Features, including AI/ML services, real-time monitoring, certification system, and enterprise security features.

## 🚀 Quick Setup

### 1. Required API Keys

You'll need to obtain API keys from the following services:

#### AI/ML Services
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Pinecone**: https://app.pinecone.io/

#### Blockchain Services
- **Helius**: https://helius.xyz/
- **QuickNode**: https://www.quicknode.com/
- **Geyser**: https://geyser.fm/

#### IPFS Services
- **Pinata**: https://pinata.cloud/
- **NFT.Storage**: https://nft.storage/

#### Monitoring Services
- **Datadog**: https://app.datadoghq.com/
- **Sentry**: https://sentry.io/

### 2. Environment Variables by Category

## 🔐 Core Configuration

```bash
# Server Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=3001
API_HOST=localhost:3001

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🗄️ Database Configuration

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://solguard:solguard123@localhost:5432/solguard

# Redis Cache
REDIS_URL=redis://localhost:6379

# Apache Kafka (for real-time streaming)
KAFKA_BROKERS=localhost:9092
```

## 🔑 Authentication & Security

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# SolGuard Authority (for certificate signing)
SOLGUARD_AUTHORITY_PRIVATE_KEY=[]

# Security Headers
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🌐 Solana Configuration

```bash
# Solana RPC Endpoints
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_URL=https://api.devnet.solana.com
SOLANA_TESTNET_URL=https://api.testnet.solana.com

# Solana Program IDs
SOLANA_PROGRAM_ID=11111111111111111111111111111111
```

## 🧠 AI/ML Services

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-1106-preview
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.1

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Pinecone Vector Database
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX_NAME=solguard-vulnerabilities

# LangChain Configuration
LANGCHAIN_API_KEY=your-langchain-api-key
LANGCHAIN_PROJECT=solguard-ai
```

## 📡 Real-time Monitoring

```bash
# Geyser gRPC (Ultra-low latency)
GEYSER_GRPC_URL=your-geyser-grpc-url
GEYSER_ACCESS_TOKEN=your-geyser-access-token

# Helius Enhanced APIs
HELIUS_API_KEY=your-helius-api-key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-helius-api-key

# QuickNode WebSocket
QUICKNODE_API_KEY=your-quicknode-api-key
QUICKNODE_WS_URL=wss://your-endpoint.quiknode.pro/your-api-key/

# Real-time Monitoring Toggle
ENABLE_REAL_TIME_MONITORING=true
MONITORING_HEARTBEAT_INTERVAL=30000
MONITORING_MAX_CONNECTIONS=1000
```

## 🏆 Certification System

```bash
# Metaplex Configuration
METAPLEX_RPC_URL=https://api.mainnet-beta.solana.com
METAPLEX_AUTHORITY_KEYPAIR=your-authority-keypair-json

# IPFS Configuration
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
IPFS_PROVIDERS=https://node2.bundlr.network,https://api.pinata.cloud,https://api.nft.storage

# Pinata IPFS
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/

# NFT.Storage
NFT_STORAGE_API_KEY=your-nft-storage-api-key

# Certificate Configuration
CERTIFICATE_COLLECTION_NAME=SolGuard Security Certificates
CERTIFICATE_COLLECTION_SYMBOL=SGC
CERTIFICATE_TREE_DEPTH=20
CERTIFICATE_TREE_BUFFER_SIZE=256
```

## 📊 Monitoring & Analytics

```bash
# Prometheus Metrics
PROMETHEUS_ENDPOINT=http://localhost:9090
PROMETHEUS_PUSHGATEWAY=http://localhost:9091

# Grafana Configuration
GRAFANA_URL=http://localhost:3001
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=admin

# Datadog Monitoring
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
DATADOG_SITE=datadoghq.com

# Sentry Error Tracking
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_FILE=logs/solguard.log
```

## 🔔 Notification Services

```bash
# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
SLACK_CHANNEL=#security-alerts

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SolGuard Security <security@solguard.com>

# PagerDuty Integration
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-integration-key
PAGERDUTY_SERVICE_KEY=your-pagerduty-service-key
```

## 🌍 External APIs

```bash
# CoinGecko API
COINGECKO_API_KEY=your-coingecko-api-key
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3

# DeFiLlama API
DEFILLAMA_API_URL=https://api.llama.fi

# Solana Explorer API
SOLANA_EXPLORER_API_URL=https://api.solscan.io
SOLANA_EXPLORER_API_KEY=your-solscan-api-key
```

## 🔒 Security & Compliance

```bash
# Encryption Keys
ENCRYPTION_KEY=your-32-character-encryption-key
SIGNING_KEY=your-signing-key-for-audit-reports

# Compliance Configuration
SOC2_COMPLIANCE=true
GDPR_COMPLIANCE=true
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years

# Security Scanning
SNYK_API_TOKEN=your-snyk-api-token
SONARQUBE_TOKEN=your-sonarqube-token
SONARQUBE_URL=http://localhost:9000
```

## 🚀 Performance & Scaling

```bash
# Redis Configuration
REDIS_MAX_CONNECTIONS=100
REDIS_RETRY_DELAY=1000
REDIS_RETRY_ATTEMPTS=3

# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000

# API Rate Limiting
API_RATE_LIMIT_WINDOW=900000  # 15 minutes
API_RATE_LIMIT_MAX=100
API_RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=1000
WS_MESSAGE_SIZE_LIMIT=1048576  # 1MB
```

## 🧪 Testing & Development

```bash
# Test Configuration
TEST_DATABASE_URL=postgresql://solguard:solguard123@localhost:5432/solguard_test
TEST_REDIS_URL=redis://localhost:6379/1
TEST_SOLANA_RPC_URL=https://api.devnet.solana.com

# Development Tools
DEBUG_MODE=true
VERBOSE_LOGGING=true
MOCK_EXTERNAL_APIS=false
```

## 📝 Setup Instructions

### Step 1: Copy the Template

```bash
cp .env.example .env
```

### Step 2: Update Required Variables

Edit your `.env` file and add the API keys you've obtained:

```bash
# Essential for basic functionality
OPENAI_API_KEY=sk-your-openai-api-key-here
SOLGUARD_AUTHORITY_PRIVATE_KEY=[your-authority-keypair-json]

# Essential for advanced features
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
GEYSER_ACCESS_TOKEN=your-geyser-access-token
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
```

### Step 3: Generate Authority Keypair

```bash
# Generate a new Solana keypair for certificate authority
solana-keygen new --outfile ~/.config/solana/authority.json

# Convert to JSON array format for environment variable
node -e "console.log(JSON.stringify(Array.from(require('fs').readFileSync('~/.config/solana/authority.json'))))"
```

### Step 4: Validate Configuration

```bash
# Test the configuration
node scripts/validate-env.js
```

## ⚠️ Security Best Practices

1. **Never commit API keys to version control**
2. **Use different keys for development and production**
3. **Rotate keys regularly**
4. **Use environment-specific configurations**
5. **Enable API key restrictions where possible**
6. **Monitor API usage and set up alerts**

## 🔍 Troubleshooting

### Common Issues

1. **Missing API Keys**: Ensure all required keys are set
2. **Invalid Key Format**: Check key format and length
3. **Network Issues**: Verify RPC endpoints are accessible
4. **Rate Limits**: Monitor API usage and implement backoff

### Validation Commands

```bash
# Check environment variables
node -e "console.log(process.env.OPENAI_API_KEY ? 'OpenAI: ✅' : 'OpenAI: ❌')"

# Test Solana connection
node -e "const { Connection } = require('@solana/web3.js'); new Connection(process.env.SOLANA_RPC_URL).getVersion().then(console.log)"

# Test Redis connection
node -e "const Redis = require('ioredis'); new Redis(process.env.REDIS_URL).ping().then(console.log)"
```

## 📞 Support

If you encounter issues with environment setup:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review the [API Documentation](./API_DOCS.md)
3. Join our [Discord Community](https://discord.gg/solguard)
4. Create a [GitHub Issue](https://github.com/your-repo/issues)

---

**🎉 Once configured, you'll have access to all SolGuard Advanced Features!**
