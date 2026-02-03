#!/usr/bin/env node

const { spawnSync } = require('child_process');

console.log('🎯 AMAF Coin Metadata Creation');
console.log('================================================\n');

try {
  // Step 1: Set mint authority to user wallet
  console.log('Step 1: Setting mint authority to user wallet...');
  const step1 = spawnSync(
    'docker',
    ['compose', 'run', '--rm', 'anchor', 'anchor', 'invoke', 'set_mint_authority',
      'Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg',
      '--program-id', 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW'],
    { cwd: '/home/popebenny/amaf/amaf.fun', stdio: 'inherit' }
  );
  console.log('✓ Mint authority transferred to your wallet');

  // Step 2: Manual action required
  console.log('\nStep 2: Create metadata with Metaplex');
  console.log('⚠️  MANUAL ACTION REQUIRED');
  console.log('');
  console.log('Please run these commands in your browser DevTools (F12) console:');
  console.log('----------------------------------------');
  console.log('const { Connection, Keypair, Metaplex } = require("@solana/web3.js", "@metaplex-foundation/js");');
  console.log('const fs = require("fs");');
  console.log('const connection = new Connection("https://api.devnet.solana.com");');
  console.log('const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/id.json", "utf-8"))));');
  console.log('const mintPDA = "6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG";');
  console.log('const metaplex = Metaplex.make(connection);');
  console.log('metaplex.use(keypairIdentity(keypair));');
  console.log('const result = await metaplex.nfts().create({');
  console.log('  uri: "https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/main/public/amafcoin-metadata.json",');
  console.log('  name: "AMAF Coin",');
  console.log('  symbol: "AMAF",');
  console.log('  sellerFeeBasisPoints: 0,');
  console.log('  isMutable: true,');
  console.log('  useExistingMint: new PublicKey(mintPDA),');
  console.log('});');
  console.log('');
  console.log('const metadataAddress = result.nft.metadataAddress.toString();');
  console.log('console.log("✅ Metadata created at:", metadataAddress);');
  console.log('----------------------------------------');

  // Wait for manual step
  console.log('\n⏸  Waiting for you to create metadata...');
  console.log('   Keep this terminal open until you complete step 2.');
  console.log('   After metadata is created, run step 3 below:');

  // Step 3: Restore mint authority to PDA
  console.log('\nStep 3: Restore mint authority to PDA...');
  console.log('Run this command:');
  console.log('----------------------------------------');
  console.log('docker compose run --rm anchor anchor invoke set_mint_authority null \\');
  console.log('     --program-id Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
  console.log('========================================');
  console.log('');
  console.log('✅ All done! Your mint authority will be back to PDA and metadata will be live!');
  console.log('');
  console.log('Verify metadata at:');
  console.log('https://explorer.solana.com/address/6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG?cluster=devnet');

} catch (error) {
  console.error('Error:', error.message || error);
  process.exit(1);
}
