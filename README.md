<p align="center">
  <img src="docs/assets/logo.png" alt="SolGuard Logo" width="200"/>
</p>

<h1 align="center">SolGuard</h1>

<p align="center">
  <strong>AI-Powered Security Platform for the Solana Ecosystem</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Solana-Web3-9945FF?style=flat-square&logo=solana&logoColor=white" alt="Solana">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
</p>

---

## Overview

SolGuard is a comprehensive, full-lifecycle security platform for the Solana blockchain ecosystem. It provides real-time risk analysis, automated smart contract auditing, and proactive threat monitoring powered by AI/ML technologies.

The platform serves three primary user segments:
- **Retail Users (B2C)**: Instant token risk scoring and wallet protection
- **Developers (B2B)**: Automated smart contract auditing and CI/CD integration
- **Enterprise**: 24/7 monitoring, threat intelligence, and compliance solutions

## Features

### Risk Score Analysis
Real-time risk assessment for any Solana token or program with a 0-100 score calculated in under 30 seconds.

| Component | Weight | Description |
|-----------|--------|-------------|
| On-Chain Analysis | 40% | Liquidity depth, holder distribution, transaction patterns |
| Static Analysis | 30% | Code quality, security patterns, vulnerability detection |
| Dynamic Analysis | 30% | Runtime behavior, gas optimization, execution paths |

### Risk Level Classification
| Score | Level | Recommendation |
|-------|-------|----------------|
| 80-100 | Low | Generally safe for interaction |
| 60-79 | Medium | Exercise caution |
| 40-59 | High | Significant concerns present |
| 0-39 | Critical | Avoid or investigate thoroughly |

### AI-Powered Auditing
- GPT-4 fine-tuned for Solana vulnerability detection
- 150+ vulnerability checks including Anchor-specific patterns
- Vector database with 50K+ known vulnerability signatures
- Automated report generation with severity scoring

### Real-Time Monitoring
- Geyser gRPC integration for ultra-low latency alerts (<3s)
- Multi-channel notifications (Slack, Email, PagerDuty, Webhooks)
- Anomaly detection and threat intelligence
- WebSocket API for live dashboard updates

### cNFT Certification System
- On-chain security certificates via Metaplex Bubblegum
- Merkle proof verification
- IPFS metadata storage with redundancy
- Sub-cent minting costs (<$0.01 per certificate)

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Docker and Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sol-guard.git
cd sol-guard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start services
docker-compose up -d

# Start development server
npm run dev
```

### Access Points
| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | React frontend |
| API | http://localhost:3001 | Fastify backend |
| API Docs | http://localhost:3001/docs | Swagger/OpenAPI |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

### Quick Test

```bash
# Verify API health
curl http://localhost:3001/health

# Analyze a token
curl -X POST http://localhost:3001/api/tokens/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}'
```

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                               │
├───────────────┬───────────────┬──────────────────────────────────┤
│   Web App     │   Extension   │          SDK / API               │
│   (React)     │   (Browser)   │         (Third-party)            │
└───────┬───────┴───────┬───────┴──────────────┬───────────────────┘
        │               │                       │
        └───────────────┼───────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────────┐
│                       API GATEWAY                                  │
│  Rate Limiting │ Authentication │ Request Validation │ Metrics    │
└───────────────────────┬───────────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────────┐
│                     SERVICE LAYER                                  │
├───────────────┬───────────────┬───────────────┬──────────────────┤
│ Risk Score    │ AI Analysis   │ Audit Engine  │ Certification    │
│ Service       │ Engine        │               │ Service          │
├───────────────┼───────────────┼───────────────┼──────────────────┤
│ Monitoring    │ Token         │ User          │ Notification     │
│ Service       │ Service       │ Service       │ Service          │
└───────┬───────┴───────┬───────┴───────┬───────┴──────────────────┘
        │               │               │
┌───────▼───────┬───────▼───────┬───────▼───────────────────────────┐
│               │               │                                    │
│  PostgreSQL   │    Redis      │         External APIs              │
│  (Primary DB) │   (Cache)     │  (Solana RPC, OpenAI, Helius)     │
│               │               │                                    │
└───────────────┴───────────────┴────────────────────────────────────┘
```

### Project Structure

```
sol-guard/
├── apps/
│   ├── api/                 # Fastify backend server
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── services/    # Business logic services
│   │   │   ├── middleware/  # Custom middleware
│   │   │   └── server.ts    # Application entry point
│   │   └── package.json
│   ├── web/                 # React frontend application
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/       # Page components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── stores/      # Zustand state stores
│   │   │   └── services/    # API client services
│   │   └── package.json
│   └── extension/           # Browser extension (planned)
├── packages/
│   ├── blockchain/          # Solana integration library
│   ├── types/               # Shared TypeScript definitions
│   ├── ui/                  # Shared UI component library
│   └── shared/              # Common utilities
├── scripts/                 # Setup and utility scripts
├── docs/                    # Documentation
└── docker-compose.yml       # Container orchestration
```

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| TypeScript | 5.2 | Type safety |
| Vite | 4.4 | Build tool |
| Tailwind CSS | 3.3 | Styling |
| Shadcn/ui | Latest | Component library |
| Zustand | 4.4 | State management |
| React Router | 6.x | Routing |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Fastify | 4.21 | Web framework |
| PostgreSQL | 15 | Primary database |
| Redis | 7 | Caching & sessions |
| Drizzle ORM | 0.28 | Database ORM |
| Zod | 3.22 | Schema validation |

### Blockchain
| Technology | Purpose |
|------------|---------|
| @solana/web3.js | Solana SDK |
| @metaplex-foundation/* | NFT operations |
| @solana/spl-token | Token program |
| Helius API | Enhanced RPC |
| Jupiter | DEX aggregation |

### AI/ML
| Technology | Purpose |
|------------|---------|
| OpenAI GPT-4 | Contract analysis |
| Pinecone | Vector database |
| LangChain | LLM orchestration |
| Anthropic Claude | Alternative AI |

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start all services in dev mode
npm run build        # Production build
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation

# Docker
docker-compose up -d       # Start all containers
docker-compose down        # Stop all containers
docker-compose logs -f     # Stream logs
```

### Environment Variables

See `.env.example` for the complete list. Key variables:

```bash
# Core
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/solguard
REDIS_URL=redis://localhost:6379

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# AI Services
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...

# Security
JWT_SECRET=...
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design and data flow |
| [API Reference](docs/API_REFERENCE.md) | Complete API documentation |
| [Deployment](docs/DEPLOYMENT.md) | Production deployment guide |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines |
| [Security](SECURITY.md) | Security policies |

## Roadmap

### Phase 1: Foundation (Completed)
- [x] Monorepo architecture with Turbo
- [x] React frontend with Vite
- [x] Fastify backend with TypeScript
- [x] PostgreSQL and Redis integration
- [x] Basic risk score calculation
- [x] Solana RPC integration

### Phase 2: Core Features (In Progress)
- [x] Advanced risk scoring algorithm
- [x] Token metadata integration
- [x] Holder distribution analysis
- [ ] AI-powered contract analysis
- [ ] Real-time monitoring system
- [ ] cNFT certification

### Phase 3: Enterprise (Planned)
- [ ] Multi-tenant architecture
- [ ] Advanced analytics dashboard
- [ ] Compliance framework (SOC2, GDPR)
- [ ] SDK for third-party developers
- [ ] Multi-chain expansion

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Risk Score Response | <200ms P95 | ~150ms |
| Real-time Alerts | <3s | <2.5s |
| API Response | <200ms P95 | ~120ms |
| AI Analysis Accuracy | >85% | Testing |

## Contributing

We welcome contributions. Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Pull request process
- Coding standards

## Security

Security vulnerabilities should be reported via our [Security Policy](SECURITY.md). Do not open public issues for security concerns.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.solguard.io](https://docs.solguard.io)
- **Discord**: [discord.gg/solguard](https://discord.gg/solguard)
- **Twitter**: [@SolGuardIO](https://twitter.com/SolGuardIO)
- **Email**: support@solguard.io

---

<p align="center">
  Built with security in mind for the Solana ecosystem
</p>
