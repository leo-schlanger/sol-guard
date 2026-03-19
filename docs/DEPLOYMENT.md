# SolGuard Deployment Guide

## Overview

This guide covers deployment strategies for SolGuard, from local development to production environments on cloud platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Cloud Providers](#cloud-providers)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 50+ GB SSD |
| Node.js | 18.0.0 | 20.x LTS |
| Docker | 20.10+ | Latest |

### Required Software

```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Docker
# Linux
curl -fsSL https://get.docker.com | sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Solana CLI (optional)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

---

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/sol-guard.git
cd sol-guard

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start infrastructure services
docker-compose up -d postgres redis

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all services in development mode |
| `npm run build` | Build all packages for production |
| `npm run test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run clean` | Clean build artifacts |

### Environment Variables

Create a `.env` file with the following configuration:

```bash
# ===========================================
# CORE CONFIGURATION
# ===========================================
NODE_ENV=development
HOST=0.0.0.0
PORT=3001
API_HOST=localhost:3001

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://solguard:solguard123@localhost:5432/solguard

# ===========================================
# REDIS
# ===========================================
REDIS_URL=redis://localhost:6379

# ===========================================
# SECURITY
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# ===========================================
# SOLANA
# ===========================================
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_URL=https://api.devnet.solana.com

# ===========================================
# AI/ML SERVICES
# ===========================================
OPENAI_API_KEY=sk-your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-environment

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

---

## Docker Deployment

### Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: solguard-postgres
    environment:
      POSTGRES_USER: solguard
      POSTGRES_PASSWORD: solguard123
      POSTGRES_DB: solguard
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U solguard"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: solguard-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: solguard-api
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://solguard:solguard123@postgres:5432/solguard
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: solguard-web
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### Production Docker Build

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/*/
RUN npm ci --workspace=apps/api

# Build
COPY . .
RUN npm run build --workspace=apps/api

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates obtained
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Load testing performed

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

# Database (use connection pooling)
DATABASE_URL=postgresql://user:pass@db.host.com:5432/solguard?sslmode=require&pool_min=2&pool_max=10

# Redis (use TLS in production)
REDIS_URL=rediss://user:pass@redis.host.com:6379

# Security
JWT_SECRET=<generate-secure-256-bit-key>
JWT_EXPIRES_IN=1d
BCRYPT_ROUNDS=14

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Solana (use dedicated RPC)
SOLANA_RPC_URL=https://your-rpc-provider.com

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=your-datadog-key
```

### Database Setup

```bash
# Create production database
psql -h your-db-host -U postgres -c "CREATE DATABASE solguard;"
psql -h your-db-host -U postgres -c "CREATE USER solguard WITH ENCRYPTED PASSWORD 'secure-password';"
psql -h your-db-host -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE solguard TO solguard;"

# Run migrations
DATABASE_URL="postgresql://..." npm run db:migrate
```

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.solguard.io;

    ssl_certificate /etc/letsencrypt/live/api.solguard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.solguard.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Cloud Providers

### AWS Deployment

#### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           AWS VPC                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                                │
│  │ CloudFront  │◄──── S3 (Static Assets)                        │
│  └──────┬──────┘                                                │
│         │                                                        │
│  ┌──────▼──────┐    ┌─────────────┐                             │
│  │     ALB     │────│     WAF     │                             │
│  └──────┬──────┘    └─────────────┘                             │
│         │                                                        │
│  ┌──────▼─────────────────────────────────────────────┐         │
│  │                    ECS Cluster                      │         │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │         │
│  │  │  API Task   │  │  API Task   │  │  API Task   │ │         │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │         │
│  └────────────────────────┬───────────────────────────┘         │
│                           │                                      │
│  ┌────────────────────────┼───────────────────────────┐         │
│  │ Private Subnet         │                           │         │
│  │  ┌─────────────┐  ┌────▼────────┐                  │         │
│  │  │    RDS      │  │ ElastiCache │                  │         │
│  │  │ PostgreSQL  │  │   Redis     │                  │         │
│  │  └─────────────┘  └─────────────┘                  │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

#### AWS CLI Deployment

```bash
# Create ECR repository
aws ecr create-repository --repository-name solguard-api

# Build and push image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t solguard-api -f apps/api/Dockerfile .
docker tag solguard-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/solguard-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/solguard-api:latest

# Create ECS cluster
aws ecs create-cluster --cluster-name solguard-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster solguard-cluster \
  --service-name solguard-api \
  --task-definition solguard-api:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### ECS Task Definition

```json
{
  "family": "solguard-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::...",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/solguard-api:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:..."
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:..."
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/solguard-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### GCP Deployment

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/solguard-api

# Deploy to Cloud Run
gcloud run deploy solguard-api \
  --image gcr.io/PROJECT_ID/solguard-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: solguard
services:
  - name: api
    source:
      repo: your-repo/sol-guard
      branch: main
    source_dir: apps/api
    dockerfile_path: apps/api/Dockerfile
    instance_count: 2
    instance_size_slug: professional-xs
    http_port: 3001
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET

databases:
  - name: solguard-db
    engine: PG
    version: "15"
  - name: solguard-redis
    engine: REDIS
    version: "7"
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# API health check
curl https://api.solguard.io/health

# Expected response
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

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'solguard-api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: '/metrics'
```

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `http_request_duration_seconds` | Request latency | P95 > 500ms |
| `http_requests_total` | Request count | Sudden drops |
| `node_memory_usage_bytes` | Memory usage | > 80% |
| `pg_connections_active` | DB connections | > 80% of pool |
| `redis_connected_clients` | Redis clients | > 1000 |

### Logging

```typescript
// Structured logging with Pino
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: process.env.NODE_ENV !== 'production'
    }
  },
  redact: ['password', 'apiKey', 'token']
});
```

### Backup Strategy

```bash
# PostgreSQL backup
pg_dump -h your-db-host -U solguard -F c -b -v -f "backup_$(date +%Y%m%d).dump" solguard

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
S3_BUCKET=solguard-backups

pg_dump -h $DB_HOST -U $DB_USER -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump" $DB_NAME
aws s3 cp "$BACKUP_DIR/backup_$DATE.dump" "s3://$S3_BUCKET/backups/backup_$DATE.dump"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete
```

### Rollback Procedure

```bash
# 1. Identify the issue
docker logs solguard-api --tail 100

# 2. Rollback to previous version
docker pull solguard-api:previous-tag
docker-compose up -d api

# 3. Verify health
curl https://api.solguard.io/health

# 4. Rollback database if needed
pg_restore -h your-db-host -U solguard -d solguard -c backup_YYYYMMDD.dump
```

---

## Security Hardening

### Production Security Checklist

- [ ] All secrets stored in secret manager (not environment files)
- [ ] Database connections use SSL
- [ ] Redis connections use TLS
- [ ] API behind WAF
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled (Helmet)
- [ ] Input validation on all endpoints
- [ ] Regular security updates applied
- [ ] Penetration testing completed
- [ ] OWASP Top 10 addressed

### Secret Management

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name solguard/production/db \
  --secret-string '{"username":"solguard","password":"xxx"}'

# Reference in ECS
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:solguard/production/db"
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check connection
psql -h your-db-host -U solguard -d solguard -c "SELECT 1;"

# Verify credentials
docker exec -it solguard-api env | grep DATABASE_URL

# Check network
docker network inspect solguard_default
```

#### High Memory Usage

```bash
# Check Node.js memory
docker stats solguard-api

# Increase memory limit
docker-compose.yml:
  api:
    deploy:
      resources:
        limits:
          memory: 2G
```

#### API Timeouts

```bash
# Check for slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';

# Check Redis latency
redis-cli --latency
```

### Support

For deployment issues:
1. Check the [FAQ](./FAQ.md)
2. Search [GitHub Issues](https://github.com/your-org/sol-guard/issues)
3. Join [Discord](https://discord.gg/solguard)
4. Contact support@solguard.io
