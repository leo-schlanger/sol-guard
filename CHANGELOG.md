# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive English documentation
- Architecture documentation with system diagrams
- API reference with complete endpoint documentation
- Deployment guide for multiple cloud providers
- Contributing guidelines with coding standards
- Security policy and vulnerability reporting process

### Changed
- Migrated all documentation from Portuguese to English
- Improved README structure with badges and clearer sections
- Reorganized documentation into docs/ directory

### Removed
- Legacy Portuguese documentation files

## [0.2.0] - 2026-03-19

### Added
- Token and program analysis via Solana RPC
- Advanced blockchain integration with Helius API
- Risk score calculation with multi-component algorithm
- In-memory caching with LRU eviction
- Holder distribution analysis
- Transaction history analysis
- Liquidity pool detection

### Changed
- Refactored types for risk score testing
- Improved error handling in Solana service

## [0.1.0] - 2026-03-15

### Added
- Initial project setup with Turbo monorepo
- React 18 frontend with Vite
- Fastify backend with TypeScript
- PostgreSQL and Redis integration
- Docker Compose configuration
- Basic API routes structure
- Shared packages (types, ui, shared, blockchain)
- Setup scripts for Windows and Unix

### Infrastructure
- TypeScript strict mode across all packages
- ESLint configuration
- Swagger API documentation
- JWT authentication structure

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.2.0 | 2026-03-19 | Blockchain integration and risk scoring |
| 0.1.0 | 2026-03-15 | Initial project setup |

## Upgrading

### From 0.1.x to 0.2.x

1. Update dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

3. Update environment variables:
   - Add `HELIUS_API_KEY` for enhanced RPC
   - Add `PINECONE_API_KEY` for vector database

### From 0.2.x to 1.0.0 (Future)

Migration guide will be provided when version 1.0.0 is released.
