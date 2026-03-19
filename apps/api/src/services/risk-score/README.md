# Risk Score Module

The Risk Score module is a core component of SolGuard that calculates comprehensive risk scores for Solana tokens based on multiple on-chain and off-chain factors.

## Architecture

The risk score calculation uses a weighted multi-component algorithm:

```
Final Score = (Static × 0.30) + (Dynamic × 0.30) + (OnChain × 0.40)
```

### Components

#### 1. Static Analysis (30% weight)
- Code quality assessment
- Security pattern detection
- Known vulnerability signatures
- Upgrade authority configuration

#### 2. Dynamic Analysis (30% weight)
- Runtime behavior simulation
- Gas usage patterns
- Execution path analysis
- Transaction success rates

#### 3. On-Chain Analysis (40% weight)
- **Liquidity** (25%): Total liquidity depth, stability, DEX pool distribution
- **Holder Distribution** (25%): Unique holders, Gini coefficient, top holder concentration
- **Program Security** (25%): Verification status, audit status, authority configuration
- **Market Behavior** (25%): Price volatility, trading patterns, volume analysis

## API Endpoints

### Get Token Risk Score

```http
GET /api/v1/risk-score/:tokenAddress
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeHistory` | boolean | false | Include historical risk scores |
| `includeDetailedReport` | boolean | false | Include detailed analysis breakdown |

**Response:**

```json
{
  "success": true,
  "data": {
    "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "riskScore": 85,
    "riskLevel": "low",
    "components": {
      "static": { "score": 90, "weight": 0.30 },
      "dynamic": { "score": 82, "weight": 0.30 },
      "onChain": { "score": 84, "weight": 0.40 }
    },
    "analyzedAt": "2026-03-19T10:30:00.000Z"
  }
}
```

### Get Risk Score History

```http
GET /api/v1/risk-score/:tokenAddress/history
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Number of historical entries |
| `offset` | integer | 0 | Pagination offset |

## Risk Level Classification

| Score Range | Level | Description |
|-------------|-------|-------------|
| 80-100 | `low` | Established token with good metrics |
| 60-79 | `medium` | Moderate concerns, exercise caution |
| 40-59 | `high` | Significant concerns, proceed carefully |
| 0-39 | `critical` | High risk, investigate thoroughly |

## Performance Optimization

### Caching Strategy

- **In-Memory Cache**: 5-minute TTL for risk scores
- **Cache Size**: Maximum 1,000 entries with LRU eviction
- **Cache Bypass**: Force recalculation with `?bypass_cache=true`

### Retry Logic

- Maximum 3 retry attempts for RPC failures
- Exponential backoff (1s, 2s, 4s)
- Circuit breaker pattern for external services

### Rate Limiting

| Tier | Requests/min | Burst |
|------|-------------|-------|
| Free | 10 | 20 |
| Developer | 100 | 200 |
| Enterprise | 1,000 | 2,000 |

## Database Schema

```sql
-- Risk score records
CREATE TABLE risk_scores (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(44) NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  static_score INTEGER,
  dynamic_score INTEGER,
  on_chain_score INTEGER,
  details JSONB,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_risk_scores_address ON risk_scores(token_address);
CREATE INDEX idx_risk_scores_analyzed_at ON risk_scores(analyzed_at);
```

## Usage Example

```typescript
import { RiskScoreService } from './RiskScoreService';
import { SolanaService } from '../solana/SolanaService';

// Initialize services
const solanaService = new SolanaService(connection);
const riskScoreService = new RiskScoreService(db, solanaService);

// Calculate risk score
const result = await riskScoreService.calculateRiskScore(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  {
    includeHistory: true,
    includeDetailedReport: true
  }
);

console.log(`Risk Score: ${result.riskScore}`);
console.log(`Risk Level: ${result.riskLevel}`);
```

## Testing

```bash
# Run unit tests
npm run test --workspace=apps/api -- --testPathPattern=risk-score

# Run with coverage
npm run test --workspace=apps/api -- --coverage --testPathPattern=risk-score
```

## Security Measures

- API key authentication required
- Input validation using Zod schemas
- Rate limiting per API key
- Comprehensive error handling
- PII-free logging

## Contributing

See the main [Contributing Guide](../../../../CONTRIBUTING.md) for guidelines on submitting changes to this module.
