# SolGuard Premium Features Roadmap

This document tracks features that are disabled in zero-budget mode and ready to be enabled when budget/monetization is available.

## Quick Reference

Search for `TODO: [PREMIUM]` in the codebase to find all premium feature integration points.

```bash
# Find all premium feature TODOs
grep -r "TODO: \[PREMIUM\]" apps/ packages/
```

---

## Feature Status Overview

| Feature | Status | Required API/Cost | Priority |
|---------|--------|-------------------|----------|
| AI Contract Analysis | Disabled | OpenAI API (~$300/mo) | High |
| Vector Database | Disabled | Pinecone (~$70/mo) | Medium |
| Premium RPC | Disabled | Helius/QuickNode (~$50-100/mo) | Medium |
| Real NFT Minting | Disabled | SOL for fees (~$0.01/cert) | Low |
| Slack Notifications | Disabled | Slack Webhook (free) | Low |
| Email Notifications | Disabled | SMTP service (~$10/mo) | Low |
| Error Tracking | Disabled | Sentry (~$26/mo) | Medium |
| APM Monitoring | Disabled | Datadog (~$15/mo) | Low |

**Estimated Total for Full Features**: ~$500-800/month

---

## 1. AI-Powered Analysis

### Current State
- Pattern-based vulnerability detection (working)
- Rule-based code quality assessment (working)
- Static analysis with regex patterns (working)

### Premium Features (Disabled)

#### OpenAI GPT-4 Integration
**File**: `apps/api/src/services/ai-analysis/engine.ts`
**Environment Variable**: `OPENAI_API_KEY`
**Cost**: ~$0.03-0.06 per 1K tokens

```typescript
// TODO: [PREMIUM] Enable GPT-4 analysis
// Set OPENAI_API_KEY to enable
```

**To Enable**:
1. Get API key from https://platform.openai.com/api-keys
2. Set `OPENAI_API_KEY` in `.env`
3. AI analysis will automatically activate

**Features Unlocked**:
- Advanced vulnerability detection with context understanding
- Natural language security recommendations
- Code quality explanations
- Similar contract pattern matching

#### Vector Database (Pinecone)
**File**: `apps/api/src/services/ai-analysis/engine.ts`
**Environment Variable**: `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`
**Cost**: ~$70/month for production tier

```typescript
// TODO: [PREMIUM] Enable vector similarity search
// Requires Pinecone for vulnerability pattern matching
```

**To Enable**:
1. Create account at https://app.pinecone.io/
2. Create index named `solguard-vulnerabilities`
3. Set `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT`

**Features Unlocked**:
- 50K+ vulnerability signature matching
- Similar contract detection
- Historical vulnerability correlation

---

## 2. Premium RPC Providers

### Current State
- Using free Solana public RPC
- Limited to ~100 requests/second
- Max 100 WebSocket subscriptions

### Premium Features (Disabled)

#### Helius Integration
**File**: `apps/api/src/services/monitoring/real-time-engine.ts`
**Environment Variable**: `HELIUS_API_KEY`
**Cost**: ~$50-500/month

```typescript
// TODO: [PREMIUM] Use Helius for enhanced RPC
// Better rate limits, enhanced APIs, priority access
```

**To Enable**:
1. Get API key from https://helius.xyz/
2. Set `HELIUS_API_KEY` in `.env`

**Features Unlocked**:
- Enhanced transaction parsing
- Better rate limits (10x free tier)
- Priority access during congestion
- Enhanced token metadata APIs

#### QuickNode Integration
**File**: `apps/api/src/services/monitoring/real-time-engine.ts`
**Environment Variable**: `QUICKNODE_API_KEY`, `QUICKNODE_WS_URL`
**Cost**: ~$75-300/month

**Features Unlocked**:
- Dedicated WebSocket connections
- Lower latency
- Better uptime SLA

---

## 3. NFT Certification System

### Current State
- Mock certificate generation (working)
- Certificate metadata creation (working)
- SVG certificate image generation (working)

### Premium Features (Disabled)

#### Real cNFT Minting
**File**: `apps/api/src/services/certification/cnft-engine.ts`
**Environment Variable**: `SOLGUARD_AUTHORITY_PRIVATE_KEY`
**Cost**: ~$0.01 per certificate (SOL network fees)

```typescript
// TODO: [PREMIUM] Real Metaplex Bubblegum minting
// Requires funded authority wallet
```

**To Enable**:
1. Generate Solana keypair: `solana-keygen new`
2. Fund wallet with ~1 SOL
3. Export private key as JSON array
4. Set `SOLGUARD_AUTHORITY_PRIVATE_KEY` in `.env`

**Features Unlocked**:
- Real on-chain certificates
- Verifiable security credentials
- Certificate marketplace integration
- Merkle proof verification

#### IPFS Storage
**File**: `apps/api/src/services/certification/cnft-engine.ts`
**Environment Variables**: `PINATA_API_KEY`, `PINATA_SECRET_KEY`
**Cost**: ~$5-20/month

**Features Unlocked**:
- Permanent metadata storage
- Redundant IPFS pinning
- Fast gateway access

---

## 4. Real-Time Monitoring

### Current State
- Basic Solana RPC subscriptions (working)
- Limited to 100 subscriptions
- In-app alerts only

### Premium Features (Disabled)

#### Geyser gRPC Integration
**Environment Variable**: `GEYSER_GRPC_URL`, `GEYSER_ACCESS_TOKEN`
**Cost**: ~$200-1000/month

```typescript
// TODO: [PREMIUM] Geyser for ultra-low latency
// <3 second alert delivery
```

**Features Unlocked**:
- Sub-second account updates
- Higher subscription limits
- Better reliability

#### Extended Monitoring
**File**: `apps/api/src/config.ts`
**Setting**: `MAX_MONITORING_SUBSCRIPTIONS`

Current limit: 100 subscriptions
Premium limit: 1000+ subscriptions

---

## 5. Notification Services

### Current State
- In-app notifications only
- Console logging

### Premium Features (Disabled)

#### Slack Integration
**Environment Variable**: `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`
**Cost**: Free (Slack app required)

```typescript
// TODO: [PREMIUM] Real Slack notifications
// apps/api/src/services/monitoring/real-time-engine.ts
```

**To Enable**:
1. Create Slack app at https://api.slack.com/apps
2. Get incoming webhook URL
3. Set `SLACK_WEBHOOK_URL` in `.env`

#### Email Notifications
**Environment Variables**: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
**Cost**: ~$10-20/month (SendGrid, Mailgun, etc.)

```typescript
// TODO: [PREMIUM] Real email notifications
// apps/api/src/services/monitoring/real-time-engine.ts
```

**To Enable**:
1. Set up SMTP service
2. Configure SMTP variables in `.env`

#### PagerDuty Integration
**Environment Variable**: `PAGERDUTY_INTEGRATION_KEY`
**Cost**: ~$15-40/user/month

**Features Unlocked**:
- On-call alerting
- Incident management
- Escalation policies

---

## 6. Observability

### Current State
- Console logging only
- Basic health checks

### Premium Features (Disabled)

#### Sentry Error Tracking
**Environment Variable**: `SENTRY_DSN`
**Cost**: ~$26/month (Team plan)

```typescript
// TODO: [PREMIUM] Sentry error tracking
// apps/api/src/config.ts
```

**To Enable**:
1. Create project at https://sentry.io/
2. Get DSN from project settings
3. Set `SENTRY_DSN` in `.env`

**Features Unlocked**:
- Automatic error capture
- Stack trace analysis
- Release tracking
- Performance monitoring

#### Datadog APM
**Environment Variable**: `DATADOG_API_KEY`
**Cost**: ~$15/host/month

**Features Unlocked**:
- Full APM tracing
- Infrastructure monitoring
- Custom dashboards
- Log aggregation

---

## Implementation Checklist

When budget becomes available, enable features in this order:

### Phase 1: Core Value ($0-50/month)
- [ ] Slack notifications (free)
- [ ] Basic email alerts (free/cheap SMTP)
- [ ] Sentry free tier

### Phase 2: Enhanced Analysis ($100-200/month)
- [ ] OpenAI GPT-4 integration
- [ ] Helius RPC upgrade
- [ ] Sentry paid tier

### Phase 3: Full Features ($300-500/month)
- [ ] Pinecone vector database
- [ ] Real NFT minting
- [ ] PagerDuty integration
- [ ] QuickNode upgrade

### Phase 4: Enterprise ($500+/month)
- [ ] Geyser gRPC
- [ ] Datadog APM
- [ ] Multi-region deployment
- [ ] Dedicated support

---

## Quick Enable Guide

```bash
# Minimal premium setup (~$100/month)
OPENAI_API_KEY=sk-...
HELIUS_API_KEY=...
SENTRY_DSN=https://...

# Full premium setup (~$500/month)
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
HELIUS_API_KEY=...
SOLGUARD_AUTHORITY_PRIVATE_KEY=[...]
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG...
SENTRY_DSN=https://...
DATADOG_API_KEY=...
```

---

## Revenue Model Suggestion

To cover premium feature costs, consider:

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | Basic risk scoring, pattern analysis, 10 analyses/day |
| Developer | $29/mo | AI analysis, 100 analyses/day, API access |
| Team | $99/mo | Everything + monitoring, Slack alerts |
| Enterprise | $499/mo | Everything + dedicated support, SLA |

Break-even at ~10-20 paying customers on Developer plan.

---

*Last updated: March 2026*
