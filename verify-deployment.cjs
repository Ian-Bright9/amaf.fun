#!/usr/bin/env node

/**
 * Verify deployment - Compare on-chain bytecode with local build
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { readFileSync } = require('fs');
const { join } = require('path');

const PROGRAM_ID = process.env.PROGRAM_ID || 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW';
const NETWORK = process.env.NETWORK || 'devnet';
const PROGRAM_DATA_ADDR = '8ZmymakS1pCfj8CHBTnwsCxsb7qVchH1Ys2zZGPn81cX';

async function compare() {
  const connection = new Connection(`https://api.${NETWORK}.solana.com`);
  
  console.log('Fetching on-chain program data...');
  const onChainData = await connection.getAccountInfo(new PublicKey(PROGRAM_DATA_ADDR));
  
  if (!onChainData) {
    console.log('✗ Could not fetch on-chain program data');
    process.exit(1);
  }
  
  const onChainBytecode = onChainData.data.slice(45);
  
  // Try to find local binary
  const possiblePaths = [
    join(__dirname, 'programs/amafcoin/target/deploy/amafcoin.so'),
    join(__dirname, 'target/deploy/amafcoin.so'),
  ];
  
  let localBytecode;
  let binaryPath;
  
  for (const path of possiblePaths) {
    try {
      localBytecode = readFileSync(path);
      binaryPath = path;
      break;
    } catch {
      // Try next path
    }
  }
  
  if (!localBytecode) {
    console.log('✗ No local binary found. Run: make build');
    process.exit(1);
  }
  
  console.log('');
  console.log('Comparison Results:');
  console.log('  On-chain size:', onChainBytecode.length, 'bytes');
  console.log('  Local size:', localBytecode.length, 'bytes');
  console.log('  Local binary:', binaryPath);
  console.log('');
  
  if (onChainBytecode.length !== localBytecode.length) {
    console.log('✗ Size mismatch!');
    console.log('  Difference:', Math.abs(onChainBytecode.length - localBytecode.length), 'bytes');
    process.exit(1);
  }
  
  // Compare byte-by-byte
  let differences = 0;
  let firstDiff = -1;
  
  for (let i = 0; i < onChainBytecode.length; i++) {
    if (onChainBytecode[i] !== localBytecode[i]) {
      differences++;
      if (firstDiff === -1) firstDiff = i;
      if (differences <= 5) {
        console.log(`  Byte ${i}: on-chain=0x${onChainBytecode[i].toString(16)}, local=0x${localBytecode[i].toString(16)}`);
      }
    }
  }
  
  console.log('');
  
  if (differences === 0) {
    console.log('✓ PERFECT MATCH!');
    console.log('  All', onChainBytecode.length, 'bytes are identical');
    console.log('');
    console.log('✓ Deployment verified - your changes are live!');
    process.exit(0);
  } else {
    console.log('✗ MISMATCH FOUND!');
    console.log('  Total differences:', differences, 'bytes');
    console.log('  First difference at byte:', firstDiff);
    console.log('');
    console.log('⚠ The deployed version differs from your local build');
    console.log('  You may need to redeploy: make deploy');
    process.exit(1);
  }
}

compare().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
