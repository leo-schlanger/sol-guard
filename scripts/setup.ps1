# SolGuard Setup Script for Windows PowerShell
Write-Host "🚀 Setting up SolGuard development environment..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$nodeVersionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeVersionNumber -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker $dockerVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    $dockerComposeVersion = docker-compose --version
    Write-Host "✅ Docker Compose $dockerComposeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install workspace dependencies
Write-Host "📦 Installing workspace dependencies..." -ForegroundColor Yellow
npm install --workspaces

# Copy environment file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update .env file with your API keys and configuration" -ForegroundColor Yellow
}

# Start Docker services
Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$postgresStatus = docker-compose ps | Select-String "solguard-postgres.*Up"
$redisStatus = docker-compose ps | Select-String "solguard-redis.*Up"

if (-not $postgresStatus) {
    Write-Host "❌ PostgreSQL service failed to start" -ForegroundColor Red
    exit 1
}

if (-not $redisStatus) {
    Write-Host "❌ Redis service failed to start" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database services are running" -ForegroundColor Green

# Build and start the application
Write-Host "🏗️  Building and starting the application..." -ForegroundColor Yellow
docker-compose up -d

# Wait for application to be ready
Write-Host "⏳ Waiting for application to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if services are running
$apiStatus = docker-compose ps | Select-String "solguard-api.*Up"
$webStatus = docker-compose ps | Select-String "solguard-web.*Up"

if (-not $apiStatus) {
    Write-Host "❌ API service failed to start" -ForegroundColor Red
    exit 1
}

if (-not $webStatus) {
    Write-Host "❌ Web service failed to start" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All services are running" -ForegroundColor Green

# Display service URLs
Write-Host ""
Write-Host "🎉 SolGuard is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:3001/docs" -ForegroundColor Cyan
Write-Host "🗄️  Database: localhost:5432" -ForegroundColor Cyan
Write-Host "🔄 Redis: localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f          # View all logs" -ForegroundColor White
Write-Host "  docker-compose logs -f api      # View API logs" -ForegroundColor White
Write-Host "  docker-compose logs -f web      # View web logs" -ForegroundColor White
Write-Host "  docker-compose down             # Stop all services" -ForegroundColor White
Write-Host "  docker-compose restart          # Restart all services" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Development commands:" -ForegroundColor Yellow
Write-Host "  npm run dev                     # Start development mode" -ForegroundColor White
Write-Host "  npm run build                   # Build all packages" -ForegroundColor White
Write-Host "  npm run test                    # Run tests" -ForegroundColor White
Write-Host "  npm run lint                    # Run linter" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Don't forget to:" -ForegroundColor Yellow
Write-Host "  1. Update .env file with your API keys" -ForegroundColor White
Write-Host "  2. Configure Solana RPC endpoints" -ForegroundColor White
Write-Host "  3. Set up OpenAI/Gemini API keys for AI features" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
