# SolGuard Development Guide

## 🚀 Quick Start

The SolGuard platform is now fully functional with real Solana integration! Here's how to get started:

### 1. Start the Application

**Option A: Using Setup Scripts (Recommended)**
```bash
# Windows
.\scripts\setup.ps1

# Linux/Mac
./scripts/setup.sh
```

**Option B: Manual Setup**
```bash
# Install dependencies
npm install

# Start database services
docker-compose up -d postgres redis

# Start the application
npm run dev
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 3. Test the API

```bash
# Test API functionality
node scripts/test-api.js
```

## 🎯 What's Working Now

### ✅ **Fully Functional Features**

1. **Real Token Analysis**
   - Analyzes actual Solana tokens using live blockchain data
   - Calculates risk scores based on on-chain metrics
   - Fetches real token metadata and holder information

2. **Risk Score Calculation**
   - **Static Analysis**: Code quality and security patterns
   - **Dynamic Analysis**: Runtime behavior and gas usage
   - **On-Chain Analysis**: Liquidity, holder distribution, transaction history
   - **Overall Score**: Weighted combination (0-100 scale)

3. **Token Information**
   - Real token metadata (name, symbol, decimals, supply)
   - Holder distribution analysis
   - Transaction history analysis
   - Liquidity assessment

4. **Frontend Integration**
   - Real-time token analysis
   - Interactive risk score visualization
   - Token information display
   - Error handling and validation

### 🔧 **Technical Implementation**

#### Backend Services
- **SolanaService**: Real RPC integration with token data fetching
- **RiskScoreService**: Sophisticated risk calculation algorithms
- **DatabaseService**: PostgreSQL with proper schema
- **RedisService**: Caching and session management

#### Frontend Features
- **API Client**: Complete integration with backend
- **State Management**: Zustand store for application state
- **Custom Hooks**: `useTokenAnalysis` for token operations
- **Real-time Updates**: Live analysis with loading states

## 🧪 Testing with Real Tokens

Try analyzing these popular Solana tokens:

### Known Tokens (with metadata)
- **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **SOL**: `So11111111111111111111111111111111111111112`
- **BONK**: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- **USDT**: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`

### How to Test
1. Go to http://localhost:3000
2. Paste any Solana token address in the search bar
3. Click "Analisar" to see the real-time analysis
4. View detailed risk breakdown and token information

## 📊 Risk Score Algorithm

The risk score is calculated using three main components:

### 1. Static Analysis (40% weight)
- Code quality assessment
- Security pattern detection
- Vulnerability scanning

### 2. Dynamic Analysis (30% weight)
- Runtime behavior analysis
- Gas usage patterns
- Execution path analysis

### 3. On-Chain Analysis (30% weight)
- **Liquidity Risk**: Based on total liquidity pools
- **Holder Concentration**: Percentage held by top 10 holders
- **Transaction Health**: Success rate and suspicious activity
- **Token Metrics**: Supply, age, and market presence

### Risk Levels
- **Low Risk (80-100)**: Established tokens with good metrics
- **Medium Risk (60-79)**: Moderate concerns but generally safe
- **High Risk (40-59)**: Significant concerns, proceed with caution
- **Critical Risk (0-39)**: High risk, avoid or investigate thoroughly

## 🔧 Development Commands

```bash
# Development
npm run dev                 # Start all services in development mode
npm run build              # Build all packages
npm run test               # Run tests
npm run lint               # Run linter

# Docker
docker-compose up -d       # Start all services
docker-compose down        # Stop all services
docker-compose logs -f     # View logs
docker-compose restart     # Restart services

# Database
docker-compose exec postgres psql -U solguard -d solguard  # Access database
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Fastify)     │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Solana RPC    │    │   Redis Cache   │
│   (Shadcn/ui)   │    │   Integration   │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
sol-guard/
├── apps/
│   ├── web/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/       # Page components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── stores/      # Zustand stores
│   │   │   └── services/    # API client
│   │   └── package.json
│   └── api/                 # Fastify backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── services/    # Business logic
│       │   └── server.ts    # Server entry point
│       └── package.json
├── packages/
│   ├── types/               # TypeScript definitions
│   └── ui/                  # Shared UI components
├── scripts/                 # Setup and utility scripts
└── docker-compose.yml       # Docker configuration
```

## 🚀 Next Steps for Enhancement

### Phase 1: AI Integration (Weeks 1-2)
1. **OpenAI/Gemini Integration**
   - Smart contract code analysis
   - Natural language vulnerability detection
   - Automated report generation

2. **Enhanced Static Analysis**
   - Solana-specific vulnerability patterns
   - Code quality metrics
   - Security best practices validation

### Phase 2: Advanced Features (Weeks 3-4)
1. **Real-time Monitoring**
   - WebSocket integration
   - Live risk score updates
   - Alert system for risk changes

2. **Audit System**
   - GitHub integration
   - Automated code analysis
   - Report generation and certification

### Phase 3: Production Features (Weeks 5-6)
1. **Authentication System**
   - User registration and login
   - Subscription management
   - API rate limiting

2. **Advanced Analytics**
   - Historical risk trends
   - Market correlation analysis
   - Predictive risk modeling

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   ```bash
   # Check if API is running
   curl http://localhost:3001/health
   
   # Restart API service
   docker-compose restart api
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose ps postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Frontend Not Loading**
   ```bash
   # Check frontend service
   docker-compose ps web
   
   # View frontend logs
   docker-compose logs web
   ```

### Performance Optimization

1. **RPC Rate Limiting**
   - Use multiple RPC providers
   - Implement request queuing
   - Add caching for frequent requests

2. **Database Optimization**
   - Add proper indexes
   - Implement connection pooling
   - Use read replicas for analytics

## 📚 API Documentation

The complete API documentation is available at:
- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI Spec**: http://localhost:3001/docs/json

### Key Endpoints

- `POST /api/tokens/analyze` - Analyze token risk score
- `GET /api/tokens/{address}` - Get token information
- `GET /api/tokens/{address}/history` - Get risk score history
- `GET /health` - Health check

## 🎉 Success!

The SolGuard platform is now fully functional with:
- ✅ Real Solana blockchain integration
- ✅ Sophisticated risk calculation algorithms
- ✅ Complete frontend-backend integration
- ✅ Production-ready infrastructure
- ✅ Comprehensive error handling
- ✅ Real-time token analysis

**Ready to analyze Solana tokens and protect your investments! 🚀**
