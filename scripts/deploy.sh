#!/bin/bash

# SolGuard Deploy Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "SolGuard Deploy Script"
echo "Environment: $ENVIRONMENT"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Pre-flight checks
log_info "Running pre-flight checks..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
log_info "Node.js version: $(node -v)"

# Check if .env exists (for production)
if [ "$ENVIRONMENT" = "production" ] && [ ! -f "$PROJECT_ROOT/.env" ]; then
    log_error ".env file not found. Copy .env.example to .env and configure."
    exit 1
fi

# Step 2: Install dependencies
log_info "Installing dependencies..."
cd "$PROJECT_ROOT"
npm ci --prefer-offline 2>/dev/null || npm install

# Step 3: Run type checking
log_info "Running type checks..."
npm run type-check || {
    log_error "Type checking failed!"
    exit 1
}

# Step 4: Run linting
log_info "Running linter..."
npm run lint || {
    log_warn "Linting warnings detected. Continuing..."
}

# Step 5: Run tests
log_info "Running tests..."
npm run test || {
    log_error "Tests failed!"
    exit 1
}

# Step 6: Build all packages
log_info "Building all packages..."
npm run build || {
    log_error "Build failed!"
    exit 1
}

# Step 7: Verify build outputs
log_info "Verifying build outputs..."

API_BUILD="$PROJECT_ROOT/apps/api/dist"
WEB_BUILD="$PROJECT_ROOT/apps/web/dist"

if [ ! -d "$API_BUILD" ]; then
    log_error "API build not found at $API_BUILD"
    exit 1
fi

if [ ! -d "$WEB_BUILD" ]; then
    log_error "Web build not found at $WEB_BUILD"
    exit 1
fi

log_info "Build outputs verified."

# Step 8: Display summary
echo ""
echo "========================================"
echo "Build Summary"
echo "========================================"
echo "API Build: $API_BUILD"
echo "Web Build: $WEB_BUILD"
echo ""

# Show feature flags status
log_info "Feature Flags (based on environment):"
echo "  - AI Analysis: Requires OPENAI_API_KEY"
echo "  - Premium RPC: Requires HELIUS_API_KEY"
echo "  - Real NFT Minting: Requires SOLGUARD_AUTHORITY_PRIVATE_KEY"
echo ""

# Deployment instructions
echo "========================================"
echo "Deployment Instructions"
echo "========================================"
echo ""
echo "For Docker deployment:"
echo "  docker build -t solguard-api -f apps/api/Dockerfile ."
echo "  docker build -t solguard-web -f apps/web/Dockerfile ."
echo ""
echo "For manual deployment:"
echo "  1. Copy apps/api/dist to your server"
echo "  2. Copy apps/web/dist to your static hosting (Vercel, Netlify, etc.)"
echo "  3. Set environment variables from .env.example"
echo "  4. Start API: node apps/api/dist/server.js"
echo ""
echo "For Railway/Render/Fly.io:"
echo "  Push to main branch and configure build commands in dashboard"
echo ""

log_info "Deploy preparation complete!"
