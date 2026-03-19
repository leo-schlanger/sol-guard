# SolGuard Deploy Script (PowerShell)
# Usage: .\scripts\deploy.ps1 [-Environment production]

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "SolGuard Deploy Script"
Write-Host "Environment: $Environment"
Write-Host "========================================"

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Step 1: Pre-flight checks
Write-Info "Running pre-flight checks..."

# Check Node.js version
$nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$nodeVersion -lt 18) {
    Write-Error "Node.js 18+ required. Current: $(node -v)"
    exit 1
}
Write-Info "Node.js version: $(node -v)"

# Check if .env exists (for production)
if ($Environment -eq "production" -and -not (Test-Path ".env")) {
    Write-Error ".env file not found. Copy .env.example to .env and configure."
    exit 1
}

# Step 2: Install dependencies
Write-Info "Installing dependencies..."
npm ci 2>$null
if ($LASTEXITCODE -ne 0) {
    npm install
}

# Step 3: Run type checking
Write-Info "Running type checks..."
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Error "Type checking failed!"
    exit 1
}

# Step 4: Run linting
Write-Info "Running linter..."
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Linting warnings detected. Continuing..."
}

# Step 5: Run tests
Write-Info "Running tests..."
npm run test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed!"
    exit 1
}

# Step 6: Build all packages
Write-Info "Building all packages..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# Step 7: Verify build outputs
Write-Info "Verifying build outputs..."

$apiBuild = "apps\api\dist"
$webBuild = "apps\web\dist"

if (-not (Test-Path $apiBuild)) {
    Write-Error "API build not found at $apiBuild"
    exit 1
}

if (-not (Test-Path $webBuild)) {
    Write-Error "Web build not found at $webBuild"
    exit 1
}

Write-Info "Build outputs verified."

# Step 8: Display summary
Write-Host ""
Write-Host "========================================"
Write-Host "Build Summary"
Write-Host "========================================"
Write-Host "API Build: $apiBuild"
Write-Host "Web Build: $webBuild"
Write-Host ""

Write-Info "Feature Flags (based on environment):"
Write-Host "  - AI Analysis: Requires OPENAI_API_KEY"
Write-Host "  - Premium RPC: Requires HELIUS_API_KEY"
Write-Host "  - Real NFT Minting: Requires SOLGUARD_AUTHORITY_PRIVATE_KEY"
Write-Host ""

Write-Host "========================================"
Write-Host "Deployment Instructions"
Write-Host "========================================"
Write-Host ""
Write-Host "For Docker deployment:"
Write-Host "  docker build -t solguard-api -f apps/api/Dockerfile ."
Write-Host "  docker build -t solguard-web -f apps/web/Dockerfile ."
Write-Host ""
Write-Host "For manual deployment:"
Write-Host "  1. Copy apps/api/dist to your server"
Write-Host "  2. Copy apps/web/dist to static hosting (Vercel, Netlify)"
Write-Host "  3. Set environment variables from .env.example"
Write-Host "  4. Start API: node apps/api/dist/server.js"
Write-Host ""

Write-Info "Deploy preparation complete!"
