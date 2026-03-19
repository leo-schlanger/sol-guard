# SolGuard API Reference

## Overview

The SolGuard API provides programmatic access to token risk analysis, smart contract auditing, and real-time monitoring capabilities on the Solana blockchain.

**Base URL**: `https://api.solguard.io/v1` (Production)
**Local URL**: `http://localhost:3001/api` (Development)

## Authentication

### API Key Authentication

Include your API key in the request header:

```http
Authorization: Bearer YOUR_API_KEY
```

### JWT Authentication

For user-specific endpoints, obtain a JWT token via the auth endpoints:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Rate Limits

| Tier | Requests/min | Burst | Monthly Quota |
|------|-------------|-------|---------------|
| Free | 10 | 20 | 1,000 |
| Developer | 100 | 200 | 50,000 |
| Enterprise | 1,000 | 2,000 | Unlimited |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648684800
```

---

## Endpoints

### Health Check

#### GET /health

Check API server health status.

**Request**
```http
GET /health
```

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-19T10:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "solana": "connected"
  }
}
```

---

## Token Analysis

### Analyze Token Risk Score

#### POST /api/tokens/analyze

Calculate a comprehensive risk score for a Solana token.

**Request**
```http
POST /api/tokens/analyze
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "options": {
    "includeHistory": false,
    "includeDetailedReport": true,
    "customWeights": {
      "static": 0.30,
      "dynamic": 0.30,
      "onChain": 0.40
    }
  }
}
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | Yes | Solana token mint address (base58) |
| `options.includeHistory` | boolean | No | Include historical risk scores |
| `options.includeDetailedReport` | boolean | No | Include detailed analysis breakdown |
| `options.customWeights` | object | No | Custom weights for analysis components |

**Response**
```json
{
  "success": true,
  "data": {
    "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "riskScore": 85,
    "riskLevel": "low",
    "analyzedAt": "2026-03-19T10:30:00.000Z",
    "components": {
      "staticAnalysis": {
        "score": 90,
        "weight": 0.30,
        "details": {
          "codeQuality": 95,
          "securityPatterns": 88,
          "vulnerabilities": []
        }
      },
      "dynamicAnalysis": {
        "score": 82,
        "weight": 0.30,
        "details": {
          "runtimeBehavior": 85,
          "gasEfficiency": 78,
          "executionPaths": "normal"
        }
      },
      "onChainAnalysis": {
        "score": 84,
        "weight": 0.40,
        "details": {
          "liquidity": {
            "score": 90,
            "totalUSD": 150000000,
            "pools": ["Raydium", "Orca"]
          },
          "holderDistribution": {
            "score": 75,
            "totalHolders": 125000,
            "top10Percentage": 35.5,
            "giniCoefficient": 0.65
          },
          "transactionHistory": {
            "score": 88,
            "last24h": 15420,
            "successRate": 99.8,
            "suspiciousPatterns": false
          }
        }
      }
    },
    "metadata": {
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "totalSupply": "5000000000000000"
    }
  }
}
```

**Risk Levels**

| Score | Level | Description |
|-------|-------|-------------|
| 80-100 | `low` | Generally safe for interaction |
| 60-79 | `medium` | Exercise caution |
| 40-59 | `high` | Significant concerns present |
| 0-39 | `critical` | Avoid or investigate thoroughly |

---

### Get Token Information

#### GET /api/tokens/:address

Retrieve detailed token information.

**Request**
```http
GET /api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
Authorization: Bearer YOUR_API_KEY
```

**Response**
```json
{
  "success": true,
  "data": {
    "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "name": "USD Coin",
    "symbol": "USDC",
    "decimals": 6,
    "totalSupply": "5000000000000000",
    "mintAuthority": null,
    "freezeAuthority": "7dGbd...",
    "isInitialized": true,
    "metadata": {
      "uri": "https://...",
      "image": "https://...",
      "description": "USDC is a fully collateralized US dollar stablecoin"
    },
    "market": {
      "price": 1.0001,
      "priceChange24h": 0.01,
      "volume24h": 2500000000,
      "marketCap": 32000000000
    },
    "holders": {
      "total": 125000,
      "top10": [
        {
          "address": "5Q544...",
          "balance": "150000000000",
          "percentage": 3.0
        }
      ]
    }
  }
}
```

---

### Get Risk Score History

#### GET /api/tokens/:address/history

Retrieve historical risk scores for a token.

**Request**
```http
GET /api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/history?limit=30&offset=0
Authorization: Bearer YOUR_API_KEY
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Number of records to return (max: 1000) |
| `offset` | integer | 0 | Pagination offset |
| `startDate` | ISO8601 | - | Filter by start date |
| `endDate` | ISO8601 | - | Filter by end date |

**Response**
```json
{
  "success": true,
  "data": {
    "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "history": [
      {
        "riskScore": 85,
        "riskLevel": "low",
        "analyzedAt": "2026-03-19T10:30:00.000Z",
        "components": {
          "static": 90,
          "dynamic": 82,
          "onChain": 84
        }
      },
      {
        "riskScore": 84,
        "riskLevel": "low",
        "analyzedAt": "2026-03-18T10:30:00.000Z",
        "components": {
          "static": 90,
          "dynamic": 80,
          "onChain": 83
        }
      }
    ],
    "pagination": {
      "total": 120,
      "limit": 30,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## AI Analysis

### Analyze Smart Contract

#### POST /api/v1/analyze

Perform AI-powered analysis on smart contract code.

**Request**
```http
POST /api/v1/analyze
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "contractCode": "use solana_program::...",
  "contractAddress": "11111111111111111111111111111111",
  "analysisLevel": "comprehensive",
  "options": {
    "includeGasOptimization": true,
    "includeBestPractices": true
  }
}
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contractCode` | string | Yes* | Smart contract source code |
| `contractAddress` | string | Yes* | On-chain contract address |
| `analysisLevel` | enum | No | `quick`, `standard`, `comprehensive` |
| `options.includeGasOptimization` | boolean | No | Include gas optimization suggestions |
| `options.includeBestPractices` | boolean | No | Include best practices recommendations |

*Either `contractCode` or `contractAddress` must be provided.

**Response**
```json
{
  "success": true,
  "data": {
    "analysisId": "ana_abc123",
    "status": "completed",
    "riskScore": 72,
    "riskLevel": "medium",
    "vulnerabilities": [
      {
        "id": "VUL-001",
        "severity": "high",
        "category": "access-control",
        "title": "Missing owner check",
        "description": "The withdraw function does not verify caller authority",
        "location": {
          "line": 45,
          "column": 8,
          "snippet": "pub fn withdraw(ctx: Context<Withdraw>) -> Result<()>"
        },
        "recommendation": "Add a constraint to verify the signer is the vault owner",
        "cweId": "CWE-284"
      }
    ],
    "gasOptimization": [
      {
        "location": { "line": 23 },
        "suggestion": "Consider using checked_add instead of unchecked arithmetic",
        "estimatedSavings": "~500 compute units"
      }
    ],
    "summary": {
      "totalIssues": 3,
      "critical": 0,
      "high": 1,
      "medium": 1,
      "low": 1,
      "informational": 0
    },
    "analyzedAt": "2026-03-19T10:30:00.000Z",
    "duration": 2.5
  }
}
```

---

## Audit System

### Create Audit Request

#### POST /api/v1/audit

Request a comprehensive smart contract audit.

**Request**
```http
POST /api/v1/audit
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "contractAddress": "11111111111111111111111111111111",
  "auditLevel": "comprehensive",
  "options": {
    "includeGasOptimization": true,
    "includeFuzzTesting": true,
    "notificationEmail": "dev@example.com"
  }
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "auditId": "aud_xyz789",
    "status": "pending",
    "estimatedCompletion": "2026-03-19T12:30:00.000Z",
    "contractAddress": "11111111111111111111111111111111",
    "auditLevel": "comprehensive",
    "createdAt": "2026-03-19T10:30:00.000Z"
  }
}
```

### Get Audit Status

#### GET /api/v1/audit/:auditId

Retrieve the status and results of an audit.

**Request**
```http
GET /api/v1/audit/aud_xyz789
Authorization: Bearer YOUR_API_KEY
```

**Response**
```json
{
  "success": true,
  "data": {
    "auditId": "aud_xyz789",
    "status": "completed",
    "contractAddress": "11111111111111111111111111111111",
    "results": {
      "overallScore": 82,
      "riskLevel": "low",
      "checksPerformed": 150,
      "issuesFound": 5,
      "phases": {
        "staticAnalysis": {
          "status": "completed",
          "score": 85,
          "issues": 2
        },
        "dynamicAnalysis": {
          "status": "completed",
          "score": 80,
          "issues": 2
        },
        "fuzzTesting": {
          "status": "completed",
          "testsRun": 10000,
          "crashes": 0,
          "issues": 1
        }
      },
      "vulnerabilities": [...],
      "recommendations": [...]
    },
    "report": {
      "pdfUrl": "https://reports.solguard.io/aud_xyz789.pdf",
      "jsonUrl": "https://reports.solguard.io/aud_xyz789.json"
    },
    "completedAt": "2026-03-19T12:30:00.000Z"
  }
}
```

---

## Real-Time Monitoring

### Create Monitor

#### POST /api/v1/monitor

Set up real-time monitoring for an address.

**Request**
```http
POST /api/v1/monitor
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "address": "11111111111111111111111111111111",
  "type": "program",
  "alertThresholds": [
    {
      "condition": "risk_score_change",
      "threshold": 10,
      "severity": "high"
    },
    {
      "condition": "large_transfer",
      "threshold": 1000000,
      "severity": "medium"
    },
    {
      "condition": "authority_change",
      "severity": "critical"
    }
  ],
  "notifications": {
    "slack": {
      "webhookUrl": "https://hooks.slack.com/...",
      "channel": "#security-alerts"
    },
    "email": ["security@example.com"]
  }
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "monitorId": "mon_def456",
    "address": "11111111111111111111111111111111",
    "type": "program",
    "status": "active",
    "alertThresholds": [...],
    "notifications": {...},
    "createdAt": "2026-03-19T10:30:00.000Z"
  }
}
```

### WebSocket Connection

Connect to real-time updates via WebSocket.

**Connection**
```javascript
const ws = new WebSocket('wss://api.solguard.io/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_API_KEY'
  }));

  // Subscribe to address updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    address: '11111111111111111111111111111111'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

**Message Types**

```json
// Risk score update
{
  "type": "risk_update",
  "address": "11111...",
  "riskScore": 75,
  "previousScore": 85,
  "timestamp": "2026-03-19T10:30:00.000Z"
}

// Alert triggered
{
  "type": "alert",
  "alertId": "alt_123",
  "address": "11111...",
  "condition": "large_transfer",
  "severity": "medium",
  "details": {
    "amount": 1500000,
    "from": "abc...",
    "to": "def...",
    "txSignature": "xyz..."
  },
  "timestamp": "2026-03-19T10:30:00.000Z"
}
```

---

## Certification

### Issue Certificate

#### POST /api/v1/certificates

Issue a security certificate as a cNFT after successful audit.

**Request**
```http
POST /api/v1/certificates
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "auditId": "aud_xyz789",
  "recipientWallet": "11111111111111111111111111111111",
  "metadata": {
    "customAttributes": {
      "projectName": "MyDApp",
      "version": "1.0.0"
    }
  }
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "certificateId": "cert_ghi012",
    "auditId": "aud_xyz789",
    "nftMint": "CertMint11111111111111111111111111111111111",
    "assetId": "Asset11111111111111111111111111111111111111",
    "merkleTree": "Tree111111111111111111111111111111111111111",
    "metadata": {
      "name": "SolGuard Security Certificate",
      "symbol": "SGC",
      "uri": "https://arweave.net/...",
      "attributes": [
        { "trait_type": "Audit Score", "value": "82" },
        { "trait_type": "Audit Level", "value": "Comprehensive" },
        { "trait_type": "Issue Date", "value": "2026-03-19" },
        { "trait_type": "Valid Until", "value": "2027-03-19" }
      ]
    },
    "issuedAt": "2026-03-19T10:30:00.000Z",
    "txSignature": "5xyz..."
  }
}
```

### Verify Certificate

#### GET /api/v1/certificates/:assetId/verify

Verify the authenticity of a security certificate.

**Request**
```http
GET /api/v1/certificates/Asset11111111111111111111111111111111111111/verify
```

**Response**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificateId": "cert_ghi012",
    "assetId": "Asset11111111111111111111111111111111111111",
    "issuer": "SolGuard Official",
    "auditId": "aud_xyz789",
    "auditScore": 82,
    "issuedAt": "2026-03-19T10:30:00.000Z",
    "expiresAt": "2027-03-19T10:30:00.000Z",
    "merkleProof": {
      "root": "abc...",
      "proof": ["def...", "ghi..."],
      "verified": true
    }
  }
}
```

---

## Authentication Endpoints

### Register User

#### POST /api/auth/register

Create a new user account.

**Request**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-03-19T10:30:00.000Z"
  }
}
```

### Login

#### POST /api/auth/login

Authenticate and receive JWT token.

**Request**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 604800,
    "user": {
      "userId": "usr_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### Generate API Key

#### POST /api/auth/api-keys

Generate a new API key.

**Request**
```http
POST /api/auth/api-keys
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "name": "Production Key",
  "permissions": ["read", "analyze"],
  "expiresAt": "2027-03-19T00:00:00.000Z"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "keyId": "key_abc123",
    "apiKey": "sg_live_xxxxxxxxxxxxxxxxxxxx",
    "name": "Production Key",
    "permissions": ["read", "analyze"],
    "createdAt": "2026-03-19T10:30:00.000Z",
    "expiresAt": "2027-03-19T00:00:00.000Z"
  }
}
```

**Note**: The `apiKey` is only shown once. Store it securely.

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN_ADDRESS",
    "message": "The provided token address is not a valid Solana address",
    "statusCode": 400,
    "details": {
      "field": "address",
      "value": "invalid-address",
      "expected": "Base58 encoded string, 32-44 characters"
    }
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request body |
| `INVALID_TOKEN_ADDRESS` | 400 | Invalid Solana address format |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## SDKs

### JavaScript/TypeScript

```bash
npm install @solguard/sdk
```

```typescript
import { SolGuard } from '@solguard/sdk';

const client = new SolGuard({
  apiKey: 'YOUR_API_KEY',
  environment: 'production'
});

// Analyze token
const result = await client.tokens.analyze({
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
});

console.log(`Risk Score: ${result.riskScore}`);
```

### Python (Coming Soon)

```bash
pip install solguard
```

```python
from solguard import SolGuard

client = SolGuard(api_key='YOUR_API_KEY')

result = client.tokens.analyze(
    address='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
)

print(f"Risk Score: {result.risk_score}")
```

---

## Changelog

### v1.0.0 (2026-03-19)
- Initial API release
- Token risk analysis
- AI-powered smart contract analysis
- Real-time monitoring
- cNFT certification system
