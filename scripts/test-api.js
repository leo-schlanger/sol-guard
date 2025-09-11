#!/usr/bin/env node

/**
 * Simple API test script for SolGuard
 * Tests the basic functionality of the API endpoints
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001'

async function testApi() {
  console.log('🧪 Testing SolGuard API...')
  console.log(`📍 API URL: ${API_BASE_URL}`)
  console.log('')

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch(`${API_BASE_URL}/health`)
    const healthData = await healthResponse.json()
    
    if (healthResponse.ok) {
      console.log('✅ Health check passed:', healthData.status)
    } else {
      console.log('❌ Health check failed:', healthData)
      return
    }

    // Test token analysis with USDC (known token)
    console.log('\n2. Testing token analysis...')
    const usdcAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    
    const analysisResponse = await fetch(`${API_BASE_URL}/api/tokens/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: usdcAddress,
        includeHistory: false,
        includeDetailedReport: true,
      }),
    })

    const analysisData = await analysisResponse.json()
    
    if (analysisResponse.ok && analysisData.success) {
      console.log('✅ Token analysis passed')
      console.log(`   Score: ${analysisData.data.score}/100`)
      console.log(`   Level: ${analysisData.data.level}`)
      console.log(`   Processing time: ${analysisData.processingTime}ms`)
    } else {
      console.log('❌ Token analysis failed:', analysisData.error || 'Unknown error')
    }

    // Test token info endpoint
    console.log('\n3. Testing token info...')
    const tokenInfoResponse = await fetch(`${API_BASE_URL}/api/tokens/${usdcAddress}`)
    const tokenInfoData = await tokenInfoResponse.json()
    
    if (tokenInfoResponse.ok && tokenInfoData.success) {
      console.log('✅ Token info passed')
      console.log(`   Name: ${tokenInfoData.data.name}`)
      console.log(`   Symbol: ${tokenInfoData.data.symbol}`)
      console.log(`   Decimals: ${tokenInfoData.data.decimals}`)
    } else {
      console.log('❌ Token info failed:', tokenInfoData.error || 'Unknown error')
    }

    console.log('\n🎉 API tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('\n💡 Make sure the API server is running:')
    console.log('   npm run dev (in the api directory)')
    console.log('   or')
    console.log('   docker-compose up -d')
  }
}

// Run the test
testApi()
