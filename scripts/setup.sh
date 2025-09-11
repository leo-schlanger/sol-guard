#!/bin/bash

# SolGuard Setup Script
echo "🚀 Setting up SolGuard development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker $(docker --version) detected"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker Compose $(docker-compose --version) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install workspace dependencies
echo "📦 Installing workspace dependencies..."
npm install --workspaces

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your API keys and configuration"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if ! docker-compose ps | grep -q "solguard-postgres.*Up"; then
    echo "❌ PostgreSQL service failed to start"
    exit 1
fi

if ! docker-compose ps | grep -q "solguard-redis.*Up"; then
    echo "❌ Redis service failed to start"
    exit 1
fi

echo "✅ Database services are running"

# Build and start the application
echo "🏗️  Building and starting the application..."
docker-compose up -d

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 15

# Check if services are running
if ! docker-compose ps | grep -q "solguard-api.*Up"; then
    echo "❌ API service failed to start"
    exit 1
fi

if ! docker-compose ps | grep -q "solguard-web.*Up"; then
    echo "❌ Web service failed to start"
    exit 1
fi

echo "✅ All services are running"

# Display service URLs
echo ""
echo "🎉 SolGuard is now running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/docs"
echo "🗄️  Database: localhost:5432"
echo "🔄 Redis: localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "  docker-compose logs -f          # View all logs"
echo "  docker-compose logs -f api      # View API logs"
echo "  docker-compose logs -f web      # View web logs"
echo "  docker-compose down             # Stop all services"
echo "  docker-compose restart          # Restart all services"
echo ""
echo "🔧 Development commands:"
echo "  npm run dev                     # Start development mode"
echo "  npm run build                   # Build all packages"
echo "  npm run test                    # Run tests"
echo "  npm run lint                    # Run linter"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Update .env file with your API keys"
echo "  2. Configure Solana RPC endpoints"
echo "  3. Set up OpenAI/Gemini API keys for AI features"
echo ""
echo "Happy coding! 🚀"
