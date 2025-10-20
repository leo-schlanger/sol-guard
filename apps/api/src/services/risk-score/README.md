# SolGuard Risk Score Module

The Risk Score module is a core component of SolGuard that calculates risk scores for Solana tokens based on multiple factors.

## Architecture

The risk score calculation is based on four main components:

1. **Liquidity Analysis (25%)**
   - Total liquidity depth
   - Liquidity stability over time
   - DEX pool distribution

2. **Holder Distribution (25%)**
   - Number of unique holders
   - Gini coefficient for token distribution
   - Concentration among top holders

3. **Program Security (25%)**
   - Code verification status
   - Audit status
   - Upgrade authority configuration

4. **Market Behavior (25%)**
   - Price volatility
   - Trading patterns
   - Volume analysis

## API Endpoints

### Get Token Risk Score
```http
GET /api/v1/risk-score/:tokenAddress
```

Parameters:
- `tokenAddress` (required): The Solana token address
- `includeHistory` (optional): Include historical risk scores
- `includeDetailedReport` (optional): Include detailed analysis
- `customWeights` (optional): Custom weight configuration

### Get Risk Score History
```http
GET /api/v1/risk-score/:tokenAddress/history
```

Parameters:
- `tokenAddress` (required): The Solana token address
- `limit` (optional): Number of historical entries (default: 100)
- `offset` (optional): Pagination offset (default: 0)

## Performance Optimization

- **Caching**: Risk scores are cached for 5 minutes
- **Retry Logic**: Failed RPC calls are retried up to 3 times
- **Rate Limiting**: API endpoints are rate-limited
- **Database Indexing**: Optimized queries for token addresses and timestamps

## Security Measures

- API Key Authentication
- Input Validation using Zod
- Rate Limiting
- Error Handling
- Data Sanitization

## Setup

1. Configure environment variables in `.env`
2. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Usage Example

```typescript
import { RiskScoreService } from './services/RiskScoreService';

const riskScore = await riskScoreService.calculateRiskScore(tokenAddress, {
  includeHistory: true,
  includeDetailedReport: true
});
```

## Risk Level Classification

- **Critical** (0-25): High-risk token with multiple red flags
- **High** (26-50): Significant risks present
- **Medium** (51-75): Moderate risks detected
- **Low** (76-100): Token appears relatively safe

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.
