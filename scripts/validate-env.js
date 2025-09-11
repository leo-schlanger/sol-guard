#!/usr/bin/env node

/**
 * SolGuard Environment Validation Script
 * Validates all environment variables and API connections
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const Redis = require('ioredis');
const fetch = require('node-fetch');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  results.total++;
  if (status === 'PASS') {
    results.passed++;
    log(`✅ ${testName}: PASSED`, 'green');
  } else if (status === 'WARN') {
    results.warnings++;
    log(`⚠️  ${testName}: WARNING - ${details}`, 'yellow');
  } else {
    results.failed++;
    log(`❌ ${testName}: FAILED - ${details}`, 'red');
  }
  results.details.push({ testName, status, details });
}

// Validation functions
function validateRequiredEnvVars() {
  log('\n🔍 Validating Required Environment Variables...', 'cyan');
  
  const required = [
    'NODE_ENV',
    'HOST',
    'PORT',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'SOLANA_RPC_URL'
  ];
  
  for (const envVar of required) {
    if (process.env[envVar]) {
      logTest(`Environment Variable: ${envVar}`, 'PASS');
    } else {
      logTest(`Environment Variable: ${envVar}`, 'FAIL', 'Missing required variable');
    }
  }
}

function validateOptionalEnvVars() {
  log('\n🔍 Validating Optional Environment Variables...', 'cyan');
  
  const optional = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'PINECONE_API_KEY',
    'GEYSER_ACCESS_TOKEN',
    'HELIUS_API_KEY',
    'PINATA_API_KEY',
    'DATADOG_API_KEY',
    'SENTRY_DSN'
  ];
  
  for (const envVar of optional) {
    if (process.env[envVar]) {
      logTest(`Optional Variable: ${envVar}`, 'PASS');
    } else {
      logTest(`Optional Variable: ${envVar}`, 'WARN', 'Not set (some features may be limited)');
    }
  }
}

async function validateSolanaConnection() {
  log('\n🌐 Testing Solana RPC Connection...', 'cyan');
  
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const version = await connection.getVersion();
    logTest('Solana RPC Connection', 'PASS', `Version: ${version['solana-core']}`);
  } catch (error) {
    logTest('Solana RPC Connection', 'FAIL', error.message);
  }
}

async function validateRedisConnection() {
  log('\n🔴 Testing Redis Connection...', 'cyan');
  
  try {
    const redis = new Redis(process.env.REDIS_URL);
    const pong = await redis.ping();
    if (pong === 'PONG') {
      logTest('Redis Connection', 'PASS');
    } else {
      logTest('Redis Connection', 'FAIL', 'Unexpected response');
    }
    await redis.disconnect();
  } catch (error) {
    logTest('Redis Connection', 'FAIL', error.message);
  }
}

async function validateOpenAIAPI() {
  log('\n🧠 Testing OpenAI API Connection...', 'cyan');
  
  if (!process.env.OPENAI_API_KEY) {
    logTest('OpenAI API', 'WARN', 'API key not provided');
    return;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      logTest('OpenAI API', 'PASS', `${data.data.length} models available`);
    } else {
      logTest('OpenAI API', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logTest('OpenAI API', 'FAIL', error.message);
  }
}

async function validatePineconeAPI() {
  log('\n🌲 Testing Pinecone API Connection...', 'cyan');
  
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENVIRONMENT) {
    logTest('Pinecone API', 'WARN', 'API key or environment not provided');
    return;
  }
  
  try {
    const response = await fetch(`https://controller.${process.env.PINECONE_ENVIRONMENT}.pinecone.io/actions/whoami`, {
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      logTest('Pinecone API', 'PASS', `User: ${data.user_name}`);
    } else {
      logTest('Pinecone API', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logTest('Pinecone API', 'FAIL', error.message);
  }
}

async function validateHeliusAPI() {
  log('\n🔥 Testing Helius API Connection...', 'cyan');
  
  if (!process.env.HELIUS_API_KEY) {
    logTest('Helius API', 'WARN', 'API key not provided');
    return;
  }
  
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.result === 'ok') {
        logTest('Helius API', 'PASS');
      } else {
        logTest('Helius API', 'FAIL', 'Health check failed');
      }
    } else {
      logTest('Helius API', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logTest('Helius API', 'FAIL', error.message);
  }
}

async function validatePinataAPI() {
  log('\n📌 Testing Pinata API Connection...', 'cyan');
  
  if (!process.env.PINATA_API_KEY) {
    logTest('Pinata API', 'WARN', 'API key not provided');
    return;
  }
  
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || ''
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      logTest('Pinata API', 'PASS', `Authenticated: ${data.authenticated}`);
    } else {
      logTest('Pinata API', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logTest('Pinata API', 'FAIL', error.message);
  }
}

function validateAuthorityKeypair() {
  log('\n🔐 Validating Authority Keypair...', 'cyan');
  
  if (!process.env.SOLGUARD_AUTHORITY_PRIVATE_KEY) {
    logTest('Authority Keypair', 'WARN', 'Not provided (certificate features will be limited)');
    return;
  }
  
  try {
    const keypairArray = JSON.parse(process.env.SOLGUARD_AUTHORITY_PRIVATE_KEY);
    if (Array.isArray(keypairArray) && keypairArray.length === 64) {
      const keypair = require('@solana/web3.js').Keypair.fromSecretKey(new Uint8Array(keypairArray));
      logTest('Authority Keypair', 'PASS', `Public Key: ${keypair.publicKey.toBase58()}`);
    } else {
      logTest('Authority Keypair', 'FAIL', 'Invalid keypair format (should be 64-byte array)');
    }
  } catch (error) {
    logTest('Authority Keypair', 'FAIL', error.message);
  }
}

function validateConfigurationValues() {
  log('\n⚙️  Validating Configuration Values...', 'cyan');
  
  // Check JWT secret strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length >= 32) {
    logTest('JWT Secret Strength', 'PASS');
  } else {
    logTest('JWT Secret Strength', 'WARN', 'JWT secret should be at least 32 characters');
  }
  
  // Check port number
  const port = parseInt(process.env.PORT);
  if (port && port > 1024 && port < 65536) {
    logTest('Port Configuration', 'PASS');
  } else {
    logTest('Port Configuration', 'FAIL', 'Invalid port number');
  }
  
  // Check database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('postgresql://')) {
    logTest('Database URL Format', 'PASS');
  } else {
    logTest('Database URL Format', 'FAIL', 'Invalid PostgreSQL URL format');
  }
  
  // Check Redis URL format
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && redisUrl.startsWith('redis://')) {
    logTest('Redis URL Format', 'PASS');
  } else {
    logTest('Redis URL Format', 'FAIL', 'Invalid Redis URL format');
  }
}

async function validateAPIServer() {
  log('\n🚀 Testing API Server...', 'cyan');
  
  try {
    const response = await fetch(`${process.env.FRONTEND_URL?.replace('3000', '3001') || 'http://localhost:3001'}/health`);
    if (response.ok) {
      const data = await response.json();
      logTest('API Server Health', 'PASS', `Status: ${data.status}`);
    } else {
      logTest('API Server Health', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logTest('API Server Health', 'WARN', 'Server not running or not accessible');
  }
}

// Main validation function
async function runValidation() {
  log('🔧 SolGuard Environment Validation', 'bright');
  log('=====================================', 'bright');
  
  try {
    // Load environment variables
    require('dotenv').config();
    
    // Run all validations
    validateRequiredEnvVars();
    validateOptionalEnvVars();
    validateConfigurationValues();
    validateAuthorityKeypair();
    
    // Test external connections
    await validateSolanaConnection();
    await validateRedisConnection();
    await validateOpenAIAPI();
    await validatePineconeAPI();
    await validateHeliusAPI();
    await validatePinataAPI();
    await validateAPIServer();
    
    // Print summary
    log('\n📊 Validation Summary:', 'bright');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`📈 Total: ${results.total}`, 'blue');
    log(`🎯 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`, 'magenta');
    
    // Print recommendations
    if (results.failed > 0) {
      log('\n🔧 Recommendations:', 'yellow');
      log('- Fix failed validations before proceeding', 'yellow');
      log('- Check the ENVIRONMENT_SETUP_GUIDE.md for detailed instructions', 'yellow');
    }
    
    if (results.warnings > 0) {
      log('\n💡 Optional Improvements:', 'cyan');
      log('- Consider setting up optional services for enhanced functionality', 'cyan');
      log('- Review the warnings above for missing API keys', 'cyan');
    }
    
    if (results.failed === 0) {
      log('\n🎉 Environment validation completed successfully!', 'green');
      log('You can now start the SolGuard Advanced Features.', 'green');
    } else {
      log('\n⚠️  Some validations failed. Please fix the issues above.', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Validation failed with error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`
SolGuard Environment Validation Script

Usage: node scripts/validate-env.js [options]

Options:
  --help, -h          Show this help message
  --env-file <path>   Specify custom .env file path
  --verbose, -v       Enable verbose logging

This script validates:
- Required environment variables
- Optional environment variables
- External API connections
- Configuration values
- Service health checks
  `);
  process.exit(0);
}

// Run validation
runValidation();
