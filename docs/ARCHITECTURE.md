# SolGuard Architecture

## Overview

SolGuard follows a modular, microservices-inspired architecture built on a monorepo structure. The system is designed for scalability, maintainability, and high availability while processing real-time blockchain data.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│     Web Application │  Browser Extension  │         Third-Party SDK         │
│     (React + Vite)  │     (Planned)       │           (Planned)             │
└──────────┬──────────┴──────────┬──────────┴──────────────┬──────────────────┘
           │                     │                          │
           └─────────────────────┼──────────────────────────┘
                                 │ HTTPS / WSS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Rate Limit  │ │    CORS     │ │   Helmet    │ │    JWT Authentication  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Swagger   │ │  Validation │ │   Metrics   │ │     Error Handling     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER                                   │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   Risk Score        │   AI Analysis       │         Audit Engine            │
│   Service           │   Engine            │                                 │
│   ┌─────────────┐   │   ┌─────────────┐   │   ┌─────────────────────────┐   │
│   │ Static      │   │   │ GPT-4       │   │   │ Static Analysis         │   │
│   │ Analysis    │   │   │ Integration │   │   │ (150+ checks)           │   │
│   ├─────────────┤   │   ├─────────────┤   │   ├─────────────────────────┤   │
│   │ Dynamic     │   │   │ Vector DB   │   │   │ Dynamic Analysis        │   │
│   │ Analysis    │   │   │ (Pinecone)  │   │   │ (Runtime behavior)      │   │
│   ├─────────────┤   │   ├─────────────┤   │   ├─────────────────────────┤   │
│   │ On-Chain    │   │   │ Pattern     │   │   │ Fuzz Testing            │   │
│   │ Analysis    │   │   │ Matching    │   │   │ (Automated)             │   │
│   └─────────────┘   │   └─────────────┘   │   └─────────────────────────┘   │
├─────────────────────┼─────────────────────┼─────────────────────────────────┤
│   Monitoring        │   Certification     │         Token Service           │
│   Service           │   Service           │                                 │
│   ┌─────────────┐   │   ┌─────────────┐   │   ┌─────────────────────────┐   │
│   │ Geyser gRPC │   │   │ Metaplex    │   │   │ Metadata Fetching       │   │
│   │ Connection  │   │   │ Bubblegum   │   │   │ (On-chain + Off-chain)  │   │
│   ├─────────────┤   │   ├─────────────┤   │   ├─────────────────────────┤   │
│   │ Alert       │   │   │ IPFS        │   │   │ Holder Analysis         │   │
│   │ Manager     │   │   │ Storage     │   │   │ (Distribution)          │   │
│   ├─────────────┤   │   ├─────────────┤   │   ├─────────────────────────┤   │
│   │ WebSocket   │   │   │ Merkle      │   │   │ Transaction History     │   │
│   │ Server      │   │   │ Proofs      │   │   │ (Pattern detection)     │   │
│   └─────────────┘   │   └─────────────┘   │   └─────────────────────────┘   │
└──────────┬──────────┴──────────┬──────────┴──────────────┬──────────────────┘
           │                     │                          │
           ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│     PostgreSQL      │       Redis         │        External APIs            │
│   ┌─────────────┐   │   ┌─────────────┐   │   ┌─────────────────────────┐   │
│   │ Users       │   │   │ Session     │   │   │ Solana RPC              │   │
│   │ Audits      │   │   │ Cache       │   │   │ (mainnet/devnet)        │   │
│   │ Risk Scores │   │   ├─────────────┤   │   ├─────────────────────────┤   │
│   │ API Keys    │   │   │ Rate Limit  │   │   │ Helius API              │   │
│   │ Certificates│   │   │ State       │   │   │ (Enhanced RPC)          │   │
│   └─────────────┘   │   ├─────────────┤   │   ├─────────────────────────┤   │
│                     │   │ Pub/Sub     │   │   │ Jupiter / DexScreener   │   │
│                     │   │ Channels    │   │   │ (Market data)           │   │
│                     │   └─────────────┘   │   └─────────────────────────┘   │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
```

## Component Details

### 1. Presentation Layer

#### Web Application (apps/web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast HMR and optimized builds
- **State Management**: Zustand for lightweight, scalable state
- **Routing**: React Router v6 for declarative routing
- **Styling**: Tailwind CSS with Shadcn/ui components
- **API Communication**: Custom fetch-based client with error handling

Key features:
- Token analysis dashboard
- Real-time risk score visualization
- Wallet integration via Solana Wallet Adapter
- Responsive design for mobile and desktop

#### Browser Extension (apps/extension) - Planned
- Integration with popular Solana wallets
- Real-time transaction risk assessment
- DEX trade warnings

### 2. API Gateway Layer

#### Fastify Server (apps/api)
The API gateway handles all incoming requests with multiple middleware layers:

```typescript
// Middleware chain
app.register(cors, { origin: CORS_ORIGINS });
app.register(helmet);
app.register(rateLimit, { max: 100, timeWindow: '15 minutes' });
app.register(swagger);
app.register(authPlugin);
```

**Rate Limiting Tiers**:
| Tier | Requests/min | Burst | Description |
|------|-------------|-------|-------------|
| Free | 10 | 20 | Basic access |
| Developer | 100 | 200 | Standard API access |
| Enterprise | 1000 | 2000 | High-volume access |

### 3. Service Layer

#### Risk Score Service
Calculates comprehensive risk scores using a weighted algorithm:

```
Final Score = (Static × 0.30) + (Dynamic × 0.30) + (OnChain × 0.40)
```

**Static Analysis** (30%):
- Code pattern analysis
- Known vulnerability signatures
- Security best practices validation

**Dynamic Analysis** (30%):
- Runtime behavior simulation
- Gas usage patterns
- Execution path analysis

**On-Chain Analysis** (40%):
- Liquidity depth assessment
- Holder distribution (Gini coefficient)
- Transaction history patterns
- Market behavior indicators

#### AI Analysis Engine
Leverages multiple AI models for comprehensive analysis:

```
┌─────────────────────────────────────────────────┐
│              AI Analysis Pipeline               │
├─────────────────────────────────────────────────┤
│  1. Contract Code Input                         │
│         │                                       │
│         ▼                                       │
│  2. Preprocessing & Tokenization                │
│         │                                       │
│         ▼                                       │
│  3. Vector Embedding (OpenAI)                   │
│         │                                       │
│         ▼                                       │
│  4. Similarity Search (Pinecone)                │
│         │ ────────────────────┐                 │
│         ▼                     ▼                 │
│  5. GPT-4 Analysis    6. Pattern Matching       │
│         │                     │                 │
│         └──────────┬──────────┘                 │
│                    ▼                            │
│  7. Result Aggregation & Scoring                │
│         │                                       │
│         ▼                                       │
│  8. Report Generation                           │
└─────────────────────────────────────────────────┘
```

#### Monitoring Service
Real-time blockchain monitoring with Geyser gRPC:

```
Geyser gRPC ──► Event Parser ──► Alert Manager ──► Notification Service
                    │                  │
                    ▼                  ▼
              Anomaly Detection   Multi-channel Dispatch
              (ML-based)          (Slack, Email, Webhook)
```

#### Certification Service
Issues on-chain certificates using Metaplex Bubblegum:

1. Audit completion triggers certification
2. Metadata uploaded to IPFS (Pinata)
3. cNFT minted via Bubblegum
4. Merkle proof stored for verification

### 4. Data Layer

#### PostgreSQL Schema

```sql
-- Core tables
users                  -- User accounts and profiles
api_keys              -- API key management
risk_scores           -- Historical risk score data
risk_score_history    -- Time-series risk data
audits                -- Audit records and reports
certificates          -- cNFT certificate records
monitoring_alerts     -- Alert configuration and history
usage_tracking        -- API usage metrics
```

#### Redis Usage

| Purpose | Key Pattern | TTL |
|---------|-------------|-----|
| Session | `session:{userId}` | 7 days |
| Risk Score Cache | `risk:{tokenAddress}` | 5 minutes |
| Rate Limit | `ratelimit:{ip}` | 15 minutes |
| Pub/Sub | `alerts:{channel}` | N/A |

## Data Flow

### Token Risk Analysis Flow

```
1. User Request
   │
   ▼
2. API Gateway
   ├── Rate limit check
   ├── Authentication (if required)
   └── Request validation
   │
   ▼
3. Risk Score Service
   ├── Cache check (Redis)
   │   ├── HIT: Return cached score
   │   └── MISS: Continue
   │
   ▼
4. Parallel Data Collection
   ├── Solana RPC: Token metadata, supply, holders
   ├── Helius API: Enhanced transaction data
   └── DexScreener: Market data, liquidity
   │
   ▼
5. Analysis Pipeline
   ├── Static Analysis
   ├── Dynamic Analysis
   └── On-Chain Analysis
   │
   ▼
6. Score Aggregation
   │
   ▼
7. Result Processing
   ├── Cache result (Redis, 5min TTL)
   ├── Store in history (PostgreSQL)
   └── Return response
```

### Real-Time Monitoring Flow

```
1. Geyser gRPC Stream
   │
   ▼
2. Event Parser
   ├── Transaction events
   ├── Account updates
   └── Program invocations
   │
   ▼
3. Alert Evaluation
   ├── Threshold checks
   ├── Pattern matching
   └── Anomaly detection
   │
   ▼
4. Alert Triggered?
   ├── NO: Continue monitoring
   └── YES: ▼
   │
   ▼
5. Notification Dispatch
   ├── Slack webhook
   ├── Email (SMTP)
   ├── PagerDuty
   └── Custom webhooks
   │
   ▼
6. Alert Logging (PostgreSQL)
```

## Security Architecture

### Authentication Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Client  │───►│ Gateway │───►│  Auth   │───►│ Service │
└─────────┘    └─────────┘    │ Plugin  │    └─────────┘
                              └─────────┘
     │              │              │              │
     │   Request    │   Verify     │   Valid?     │
     │   + JWT      │   Token      │              │
     │              │              │   YES: ──────►
     │              │              │   NO: 401    │
```

### Security Layers

1. **Transport**: TLS 1.3 for all communications
2. **Authentication**: JWT with RS256 signing
3. **Authorization**: Role-based access control (RBAC)
4. **Input Validation**: Zod schema validation
5. **Rate Limiting**: Token bucket algorithm
6. **Headers**: Helmet.js security headers
7. **Secrets**: Environment variables (HashiCorp Vault in production)

## Scalability Considerations

### Horizontal Scaling

```
                    ┌───────────────┐
                    │ Load Balancer │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   API Node 1  │   │   API Node 2  │   │   API Node N  │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼───────┐       ┌───────▼───────┐
        │   PostgreSQL  │       │     Redis     │
        │   (Primary)   │       │   (Cluster)   │
        └───────────────┘       └───────────────┘
```

### Caching Strategy

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| Risk Scores | Redis | 5 min | On new analysis |
| Token Metadata | Redis | 1 hour | Manual |
| User Sessions | Redis | 7 days | On logout |
| API Responses | Edge CDN | 1 min | Automatic |

## Development Patterns

### Service Pattern

All services follow a consistent pattern:

```typescript
class Service {
  private cache: CacheService;
  private db: DatabaseService;
  private external: ExternalAPI;

  constructor(dependencies: ServiceDependencies) {
    this.cache = dependencies.cache;
    this.db = dependencies.db;
    this.external = dependencies.external;
  }

  async operation(input: Input): Promise<Output> {
    // 1. Validate input
    const validated = schema.parse(input);

    // 2. Check cache
    const cached = await this.cache.get(key);
    if (cached) return cached;

    // 3. Execute business logic
    const result = await this.businessLogic(validated);

    // 4. Update cache
    await this.cache.set(key, result, TTL);

    // 5. Return result
    return result;
  }
}
```

### Error Handling

Standardized error responses:

```typescript
interface APIError {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// Example
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid token address format",
  "details": {
    "field": "address",
    "expected": "base58 string, 32-44 characters"
  }
}
```

## Monitoring and Observability

### Metrics Collection

```
┌─────────────────────────────────────────────────────┐
│                  Metrics Pipeline                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Application ──► Prometheus ──► Grafana ──► Alerts  │
│      │               │                               │
│      │               └──────► Long-term Storage     │
│      │                                               │
│      └──► Datadog (APM, Traces)                     │
│                                                      │
│  Errors ──► Sentry (Error Tracking)                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `api_request_duration_ms` | Request latency | P95 > 500ms |
| `api_error_rate` | Error percentage | > 1% |
| `risk_score_calculation_ms` | Analysis time | > 5000ms |
| `active_connections` | WebSocket connections | > 10000 |
| `cache_hit_rate` | Redis cache efficiency | < 80% |

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS / GCP                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                                │
│  │ CloudFront  │◄──── Static Assets (S3)                        │
│  │    CDN      │                                                │
│  └──────┬──────┘                                                │
│         │                                                        │
│  ┌──────▼──────┐         ┌─────────────┐                        │
│  │     ALB     │◄────────│   WAF       │                        │
│  │ (Load Bal)  │         │ (Firewall)  │                        │
│  └──────┬──────┘         └─────────────┘                        │
│         │                                                        │
│  ┌──────▼──────────────────────────────────────────┐            │
│  │                 ECS / Kubernetes                 │            │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │            │
│  │  │ API Pod │  │ API Pod │  │ API Pod │   ...    │            │
│  │  └─────────┘  └─────────┘  └─────────┘          │            │
│  └──────────────────────┬──────────────────────────┘            │
│                         │                                        │
│  ┌──────────────────────┴──────────────────────────┐            │
│  │              Data Services                       │            │
│  │  ┌───────────────┐    ┌───────────────┐         │            │
│  │  │   RDS         │    │  ElastiCache  │         │            │
│  │  │ (PostgreSQL)  │    │   (Redis)     │         │            │
│  │  └───────────────┘    └───────────────┘         │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Future Considerations

### Planned Architectural Improvements

1. **Event Sourcing**: Implement event-driven architecture for audit trail
2. **GraphQL**: Add GraphQL layer for flexible querying
3. **Multi-Region**: Deploy to multiple regions for lower latency
4. **Message Queue**: Add Kafka/RabbitMQ for async processing
5. **ML Pipeline**: Dedicated infrastructure for model training

### Multi-Chain Expansion

```
┌─────────────────────────────────────────────────────┐
│              Multi-Chain Architecture               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ Solana  │  │  EVM    │  │  Other  │             │
│  │ Adapter │  │ Adapter │  │ Adapter │             │
│  └────┬────┘  └────┬────┘  └────┬────┘             │
│       │            │            │                   │
│       └────────────┼────────────┘                   │
│                    │                                │
│           ┌────────▼────────┐                       │
│           │  Chain Agnostic │                       │
│           │  Analysis Layer │                       │
│           └─────────────────┘                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```
