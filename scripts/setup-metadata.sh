#!/usr/bin/env node

const { exec } = require('child_process');

async function runCommand(cmd, description) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: '/home/popebenny/amaf/amaf.amaf.fun' }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error:', error);
        reject(error);
      } else {
        console.log(stdout.trim());
        resolve();
      }
    });
  });
}

async function main() {
  try {
    console.log('🎯 AMAF Coin Metadata Creation');
    console.log('================================================\n');

    console.log('Step 1: Setting mint authority to your wallet');
    await runCommand(
      'docker compose run --rm anchor anchor invoke set_mint_authority Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg --program-id Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW',
      'Step 1: Setting mint authority to user wallet...'
    );

    console.log('✓ Mint authority transferred to your wallet');

    console.log('Step 2: Create metadata with Metaplex');
    console.log('⚠️  MANUAL STEP REQUIRED');
    console.log('');
    console.log('Open your browser to http://localhost:3001');
    console.log('');
    console.log('Run this command in browser DevTools console:');
    console.log('----------------------------------------');
    console.log('docker compose run --rm anchor bash -c "cd /workspace/programs/amafcoin && cargo build && cp /workspace/programs/amafcoin/target/solana/release/*.so /workspace/target/deploy/"');
    console.log('');
    console.log('----------------------------------------');
    console.log('');
    console.log('Step 3: Restore mint authority to PDA');
    console.log('Run this command:');
    console.log('----------------------------------------');
    console.log('docker compose run --rm anchor anchor invoke set_mint_authority null --program-id Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
    console.log('');
    console.log('✨ All done! Your AMAF Coin will have full metadata on devnet!');
    console.log('================================================');
    console.log('');
    console.log('Verify metadata at: https://explorer.solana.com/address/<METADATA_ADDRESS>?cluster=devnet');

  } catch (error) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

main();
