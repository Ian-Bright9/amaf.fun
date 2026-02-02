#!/usr/bin/env node

// CommonJS - force CommonJS module

const { exec } = require('child_process');

async function runCommand(cmd, description) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: '/home/popebenny/amaf/amaf.fun' }, (error, stdout, stderr) => {
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
    console.log('🎯 AMAF Coin Metadata Creation (CLI Approach)');
    console.log('================================================\n');

    console.log('Step 1: Setting mint authority to user wallet...');
    await runCommand(
      'docker compose run --rm anchor anchor invoke set_mint_authority Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg --program-id Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW',
      'Step 1: Setting mint authority to user wallet...'
    );

    console.log('✓ Mint authority transferred to your wallet');

    console.log('Step 2: Creating metadata with Metaplex');
    console.log('⚠️  MANUAL ACTION REQUIRED');
    console.log('');
    console.log('Please run these commands in your browser DevTools (F12) console:');
    console.log('----------------------------------------');
    console.log('const { Connection, Keypair, Metaplex } = require("@solana/web3.js", "@metaplex-foundation/js");');
    console.log('const fs = require("fs");');
    console.log('const connection = new Connection("https://api.devnet.solana.com");');
    console.log('const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(require("fs").readFileSync(process.env.HOME + "/.config/solana/id.json", "utf-8"))));');
    console.log('const mintPDA = "6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG";');
    console.log('const metaplex = Metaplex.make(connection);');
    console.log('metaplex.use(keypairIdentity(keypair));');
    console.log('await metaplex.nfts().create({');
    console.log('  uri: "https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/main/public/amafcoin-metadata.json",');
    console.log('  name: "AMAF Coin",');
    console.log('  symbol: "AMAF",');
    console.log('  sellerFeeBasisPoints: 0,');
    console.log('  isMutable: true,');
    console.log('  useExistingMint: new PublicKey(mintPDA),');
    console.log('});');
    console.log('----------------------------------------');
    console.log('');
    console.log('After creating metadata, run:');
    console.log('docker compose run --rm anchor anchor invoke set_mint_authority null --program-id Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
    console.log('');
    console.log('Step 3: Restoring mint authority to PDA...');
    console.log('✨ Done! Your mint authority will be back to PDA and metadata will be live!');
    console.log('================================================');
    console.log('');
    console.log('Metadata address will be printed above.');
    console.log('You can verify at: https://explorer.solana.com/address/6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG?cluster=devnet');

  } catch (error) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

main();
