# 🔑 SolGuard API Keys Setup Guide

## 🚀 Quick Start - Essential API Keys

To get SolGuard Advanced Features working, you need to obtain these essential API keys:

### 1. 🧠 OpenAI API Key (Required for AI Analysis)

**Get your key:** https://platform.openai.com/api-keys

1. Go to OpenAI Platform
2. Sign up/Login to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to your `.env` file:
   ```bash
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

**Cost:** ~$0.01-0.10 per analysis (depending on contract complexity)

### 2. 🔐 SolGuard Authority Keypair (Required for Certificates)

**Generate a new keypair:**

```bash
# Install Solana CLI if you haven't already
# https://docs.solana.com/cli/install-solana-cli-tools

# Generate new keypair
solana-keygen new --outfile ~/.config/solana/authority.json

# Convert to JSON array format for .env
node -e "
const fs = require('fs');
const keypair = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/authority.json', 'utf8'));
console.log('SOLGUARD_AUTHORITY_PRIVATE_KEY=' + JSON.stringify(keypair));
"
```

**Add to your `.env` file:**
```bash
SOLGUARD_AUTHORITY_PRIVATE_KEY=[your-keypair-array-here]
```

### 3. 🌲 Pinecone API Key (Required for Vector Database)

**Get your key:** https://app.pinecone.io/

1. Sign up for Pinecone account
2. Create a new project
3. Go to API Keys section
4. Copy your API key
5. Note your environment (e.g., `us-west1-gcp`)
6. Add to your `.env` file:
   ```bash
   PINECONE_API_KEY=your-pinecone-api-key
   PINECONE_ENVIRONMENT=your-environment
   ```

**Cost:** Free tier available, then ~$70/month for production

## 🔧 Optional but Recommended API Keys

### 4. 🔥 Helius API Key (Enhanced Solana Data)

**Get your key:** https://helius.xyz/

1. Sign up for Helius account
2. Create a new project
3. Copy your API key
4. Add to your `.env` file:
   ```bash
   HELIUS_API_KEY=your-helius-api-key
   HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-helius-api-key
   ```

**Benefits:** Enhanced RPC endpoints, better performance, webhooks

### 5. 📌 Pinata API Key (IPFS Storage)

**Get your key:** https://pinata.cloud/

1. Sign up for Pinata account
2. Go to API Keys section
3. Create new API key
4. Copy both API Key and Secret
5. Add to your `.env` file:
   ```bash
   PINATA_API_KEY=your-pinata-api-key
   PINATA_SECRET_KEY=your-pinata-secret-key
   ```

**Benefits:** Reliable IPFS storage for certificate metadata

### 6. 🤖 Anthropic API Key (Alternative AI)

**Get your key:** https://console.anthropic.com/

1. Sign up for Anthropic account
2. Go to API Keys section
3. Create new API key
4. Add to your `.env` file:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
   ```

**Benefits:** Alternative AI model for analysis

## 🧪 Testing Your Setup

After adding your API keys, test the configuration:

```bash
# Validate environment variables
node scripts/validate-env.js

# Test specific services
node -e "
console.log('OpenAI:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Pinecone:', process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Authority:', process.env.SOLGUARD_AUTHORITY_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
"
```

## 💰 Cost Estimation

| Service | Free Tier | Production Cost |
|---------|-----------|-----------------|
| OpenAI | $5 credit | ~$0.01-0.10/analysis |
| Pinecone | 1M vectors | ~$70/month |
| Helius | 100k requests | ~$99/month |
| Pinata | 1GB storage | ~$20/month |
| Anthropic | $5 credit | ~$0.01-0.05/analysis |

**Total estimated cost for production:** ~$200-300/month

## 🔒 Security Best Practices

1. **Never commit API keys to version control**
2. **Use different keys for development and production**
3. **Set up API key restrictions where possible**
4. **Monitor usage and set up billing alerts**
5. **Rotate keys regularly**

## 🚀 Next Steps

1. **Get the essential API keys** (OpenAI, Authority Keypair, Pinecone)
2. **Update your `.env` file** with the keys
3. **Run validation**: `node scripts/validate-env.js`
4. **Start the services**: `./scripts/deploy-advanced.sh`
5. **Test the features**: `node scripts/test-integration.js`

## 🆘 Need Help?

- **Documentation**: Check `ENVIRONMENT_SETUP_GUIDE.md`
- **Validation**: Run `node scripts/validate-env.js`
- **Community**: Join our Discord for support
- **Issues**: Create a GitHub issue for bugs

---

**🎉 Once you have the essential API keys, you're ready to use SolGuard Advanced Features!**
