#!/usr/bin/env node

/**
 * SolGuard Authority Keypair Generator
 * Generates a new Solana keypair for certificate authority
 */

const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating SolGuard Authority Keypair...\n');

try {
  // Generate new keypair
  const authorityKeypair = Keypair.generate();
  
  // Get the private key as array
  const privateKeyArray = Array.from(authorityKeypair.secretKey);
  
  // Display information
  console.log('✅ Authority keypair generated successfully!\n');
  console.log('📋 Keypair Information:');
  console.log(`   Public Key: ${authorityKeypair.publicKey.toBase58()}`);
  console.log(`   Private Key Length: ${privateKeyArray.length} bytes`);
  console.log(`   Private Key Array: [${privateKeyArray.slice(0, 8).join(', ')}...] (truncated)\n`);
  
  // Save to file
  const keypairPath = path.join(__dirname, '..', 'authority-keypair.json');
  const keypairData = {
    publicKey: authorityKeypair.publicKey.toBase58(),
    privateKey: privateKeyArray,
    generatedAt: new Date().toISOString(),
    purpose: 'SolGuard Certificate Authority'
  };
  
  fs.writeFileSync(keypairPath, JSON.stringify(keypairData, null, 2));
  console.log(`💾 Keypair saved to: ${keypairPath}\n`);
  
  // Display .env configuration
  console.log('🔧 Add this to your .env file:');
  console.log('='.repeat(50));
  console.log(`SOLGUARD_AUTHORITY_PRIVATE_KEY=[${privateKeyArray.join(',')}]`);
  console.log('='.repeat(50));
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   - Keep this private key secure and never share it');
  console.log('   - Never commit this key to version control');
  console.log('   - Use different keys for development and production');
  console.log('   - Consider using a hardware wallet for production');
  console.log('\n🎉 Authority keypair setup complete!');
  
} catch (error) {
  console.error('❌ Error generating keypair:', error.message);
  process.exit(1);
}
