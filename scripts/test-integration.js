#!/usr/bin/env node

/**
 * SolGuard Advanced Features Integration Test
 * Tests all advanced services end-to-end
 */

const { Connection, PublicKey } = require('@solana/web3.js');

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  TEST_CONTRACT_CODE: `
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    program_error::ProgramError,
    pubkey::Pubkey,
    msg,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> Result<(), ProgramError> {
    msg!("Processing instruction");
    
    // This is a test contract with some potential issues
    let account = &accounts[0];
    
    // Potential vulnerability: missing signer check
    // if !account.is_signer {
    //     return Err(ProgramError::InvalidAccountData);
    // }
    
    // Potential vulnerability: unchecked arithmetic
    let result = 100 + 200; // Should use checked_add
    
    msg!("Result: {}", result);
    Ok(())
}
  `,
  TEST_CONTRACT_ADDRESS: '11111111111111111111111111111111',
  TEST_WALLET_ADDRESS: '22222222222222222222222222222222'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function logTest(testName, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED - ${details}`);
  }
  testResults.details.push({ testName, status, details });
}

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${TEST_CONFIG.API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // Mock token for testing
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  const result = await makeRequest('/health');
  
  if (result.status === 200 && result.data.status === 'healthy') {
    logTest('Health Check', 'PASS');
    return true;
  } else {
    logTest('Health Check', 'FAIL', `Status: ${result.status}, Data: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function testAIAnalysis() {
  console.log('\n🧠 Testing AI Analysis Engine...');
  
  const requestBody = {
    contractCode: TEST_CONFIG.TEST_CONTRACT_CODE,
    contractAddress: TEST_CONFIG.TEST_CONTRACT_ADDRESS,
    analysisLevel: 'standard'
  };
  
  const result = await makeRequest('/api/v1/analyze', 'POST', requestBody);
  
  if (result.status === 200 && result.data.success && result.data.data.analysisId) {
    logTest('AI Analysis', 'PASS');
    return result.data.data;
  } else {
    logTest('AI Analysis', 'FAIL', `Status: ${result.status}, Error: ${result.error || 'Unknown'}`);
    return null;
  }
}

async function testAuditEngine() {
  console.log('\n🔍 Testing Audit Engine...');
  
  const requestBody = {
    contractCode: TEST_CONFIG.TEST_CONTRACT_CODE,
    contractAddress: TEST_CONFIG.TEST_CONTRACT_ADDRESS,
    auditLevel: 'standard',
    includeGasOptimization: true
  };
  
  const result = await makeRequest('/api/v1/audit', 'POST', requestBody);
  
  if (result.status === 200 && result.data.success && result.data.data.auditId) {
    logTest('Audit Engine', 'PASS');
    return result.data.data;
  } else {
    logTest('Audit Engine', 'FAIL', `Status: ${result.status}, Error: ${result.error || 'Unknown'}`);
    return null;
  }
}

async function testRealTimeMonitoring() {
  console.log('\n📡 Testing Real-time Monitoring...');
  
  const requestBody = {
    address: TEST_CONFIG.TEST_CONTRACT_ADDRESS,
    type: 'program',
    alertThresholds: [
      {
        condition: 'risk_score_high',
        severity: 'high',
        threshold: 80,
        enabled: true
      }
    ],
    webhooks: [],
    notifications: []
  };
  
  const result = await makeRequest('/api/v1/monitor', 'POST', requestBody);
  
  if (result.status === 200 && result.data.success) {
    logTest('Real-time Monitoring', 'PASS');
    return true;
  } else {
    logTest('Real-time Monitoring', 'FAIL', `Status: ${result.status}, Error: ${result.error || 'Unknown'}`);
    return false;
  }
}

async function testCertificationEngine(auditData) {
  console.log('\n🏆 Testing Certification Engine...');
  
  if (!auditData) {
    logTest('Certification Engine', 'FAIL', 'No audit data available');
    return null;
  }
  
  const requestBody = {
    auditId: auditData.auditId,
    recipientWallet: TEST_CONFIG.TEST_WALLET_ADDRESS
  };
  
  const result = await makeRequest('/api/v1/certificates', 'POST', requestBody);
  
  if (result.status === 200 && result.data.success && result.data.data.certificateId) {
    logTest('Certification Engine', 'PASS');
    return result.data.data;
  } else {
    logTest('Certification Engine', 'FAIL', `Status: ${result.status}, Error: ${result.error || 'Unknown'}`);
    return null;
  }
}

async function testCertificateVerification(certificateData) {
  console.log('\n🔍 Testing Certificate Verification...');
  
  if (!certificateData) {
    logTest('Certificate Verification', 'FAIL', 'No certificate data available');
    return false;
  }
  
  const result = await makeRequest(`/api/v1/certificates/${certificateData.certificateId}/verify`);
  
  if (result.status === 200 && result.data.success) {
    logTest('Certificate Verification', 'PASS');
    return true;
  } else {
    logTest('Certificate Verification', 'FAIL', `Status: ${result.status}, Error: ${result.error || 'Unknown'}`);
    return false;
  }
}

async function testMonitoringMetrics() {
  console.log('\n📊 Testing Monitoring Metrics...');
  
  const result = await makeRequest('/api/v1/metrics');
  
  if (result.status === 200 && result.data.success && result.data.data.metrics) {
    logTest('Monitoring Metrics', 'PASS');
    return true;
  } else {
    logTest('Monitoring Metrics', 'FAIL', `Status: ${result.status}, Error: ${result.error || 'Unknown'}`);
    return false;
  }
}

async function testWebSocketConnection() {
  console.log('\n🔌 Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    try {
      const WebSocket = require('ws');
      const ws = new WebSocket('ws://localhost:3001/ws');
      
      const timeout = setTimeout(() => {
        ws.close();
        logTest('WebSocket Connection', 'FAIL', 'Connection timeout');
        resolve(false);
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        logTest('WebSocket Connection', 'PASS');
        resolve(true);
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        logTest('WebSocket Connection', 'FAIL', error.message);
        resolve(false);
      });
    } catch (error) {
      logTest('WebSocket Connection', 'FAIL', 'WebSocket library not available');
      resolve(false);
    }
  });
}

async function testPerformanceBenchmarks() {
  console.log('\n⚡ Testing Performance Benchmarks...');
  
  const startTime = Date.now();
  const result = await makeRequest('/api/v1/analyze', 'POST', {
    contractCode: TEST_CONFIG.TEST_CONTRACT_CODE,
    analysisLevel: 'basic'
  });
  const endTime = Date.now();
  
  const responseTime = endTime - startTime;
  const benchmark = 200; // 200ms benchmark
  
  if (result.status === 200 && responseTime <= benchmark) {
    logTest('Performance Benchmark', 'PASS', `Response time: ${responseTime}ms (benchmark: ${benchmark}ms)`);
    return true;
  } else {
    logTest('Performance Benchmark', 'FAIL', `Response time: ${responseTime}ms (benchmark: ${benchmark}ms)`);
    return false;
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🧪 Starting SolGuard Advanced Features Integration Tests...');
  console.log(`📡 Testing against: ${TEST_CONFIG.API_BASE_URL}`);
  
  try {
    // Basic health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('\n❌ Health check failed. Please ensure the API server is running.');
      process.exit(1);
    }
    
    // Test AI Analysis Engine
    const aiResult = await testAIAnalysis();
    
    // Test Audit Engine
    const auditResult = await testAuditEngine();
    
    // Test Real-time Monitoring
    await testRealTimeMonitoring();
    
    // Test Certification Engine (depends on audit result)
    const certResult = await testCertificationEngine(auditResult);
    
    // Test Certificate Verification (depends on cert result)
    await testCertificateVerification(certResult);
    
    // Test Monitoring Metrics
    await testMonitoringMetrics();
    
    // Test WebSocket Connection
    await testWebSocketConnection();
    
    // Test Performance Benchmarks
    await testPerformanceBenchmarks();
    
    // Print test summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Total: ${testResults.total}`);
    console.log(`🎯 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    // Print detailed results
    console.log('\n📋 Detailed Results:');
    testResults.details.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${test.testName}${test.details ? ` - ${test.details}` : ''}`);
    });
    
    // Exit with appropriate code
    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! SolGuard Advanced Features are working correctly.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed. Please check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Integration test failed with error:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
SolGuard Advanced Features Integration Test

Usage: node scripts/test-integration.js [options]

Options:
  --help, -h          Show this help message
  --api-url <url>     Set API base URL (default: http://localhost:3001)
  --verbose, -v       Enable verbose logging

Environment Variables:
  API_BASE_URL        API base URL for testing
  `);
  process.exit(0);
}

if (process.argv.includes('--api-url')) {
  const index = process.argv.indexOf('--api-url');
  if (index + 1 < process.argv.length) {
    TEST_CONFIG.API_BASE_URL = process.argv[index + 1];
  }
}

// Run the tests
runIntegrationTests();
