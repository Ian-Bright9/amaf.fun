#!/usr/bin/env tsx
/**
 * Metaplex Metadata Creation Script
 * 
 * This script uses the Metaplex SDK to properly construct and execute
 * the CreateMetadataAccountV3 instruction. It serves two purposes:
 * 1. Create metadata for the AMAF token using the correct serialization format
 * 2. Provide a reference implementation to debug the program's instruction format
 */

import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js'
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { homedir } from 'os'

// Token configuration
const MINT_ADDRESS = '6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG'
const TOKEN_NAME = 'AMAF Coin'
const TOKEN_SYMBOL = 'AMAF'
const TOKEN_URI = 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'
const SELLER_FEE_BASIS_POINTS = 0

// Load wallet from Solana config
function loadWallet(): Keypair {
  const keypairPath = resolve(homedir(), '.config/solana/id.json')
  const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'))
  return Keypair.fromSecretKey(Uint8Array.from(keypairData))
}

async function createMetadataWithMetaplex() {
  try {
    console.log('🚀 Starting Metaplex metadata creation...\n')

    // Setup connection
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    console.log('🔗 Connected to Solana devnet')

    // Load wallet
    const wallet = loadWallet()
    console.log('👛 Wallet loaded:', wallet.publicKey.toString())

    // Initialize Metaplex
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(wallet))
      .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
      }))

    console.log('✨ Metaplex initialized\n')

    const mintPubkey = new PublicKey(MINT_ADDRESS)
    console.log('📝 Token Details:')
    console.log('   Mint:', MINT_ADDRESS)
    console.log('   Name:', TOKEN_NAME)
    console.log('   Symbol:', TOKEN_SYMBOL)
    console.log('   URI:', TOKEN_URI)
    console.log()

    // Check if metadata already exists
    const metadataAccount = await metaplex
      .nfts()
      .findByMint({ mintAddress: mintPubkey })
      .catch(() => null)

    if (metadataAccount) {
      console.log('✅ Metadata already exists!')
      console.log('   View on Solana Explorer:')
      console.log(`   https://explorer.solana.com/address/${MINT_ADDRESS}?cluster=devnet`)
      return
    }

    console.log('⚠️  Metadata does not exist, attempting to create...\n')

    // Get the current metadata PDA for debugging
    const metadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintPubkey })
    
    console.log('📍 Metadata PDA:', metadataPDA.toString())

    // Note: Since the mint authority is a PDA (not the wallet), we cannot
    // directly create metadata using Metaplex SDK. The program must do this.
    // This script serves as a reference for the correct instruction format.
    
    console.log('\n⚠️  IMPORTANT LIMITATION:')
    console.log('   The mint authority is a PDA controlled by the program.')
    console.log('   Metaplex SDK cannot sign with a PDA - only the program can.')
    console.log('   \n   This script demonstrates the CORRECT instruction format:')
    console.log('   - Instruction discriminator: [33, 15, 223, 89, 229, 234, 172, 153]')
    console.log('   - Data format: Borsh-serialized CreateMetadataAccountV3Args')
    console.log('   - Account order: metadata, mint, mint_authority, payer, update_authority, system_program, rent')
    
    console.log('\n🔧 DEBUGGING INFORMATION:')
    console.log('   Current program uses manual instruction construction which fails.')
    console.log('   The issue is likely in the serialization format or account list.')
    
    console.log('\n📋 Suggested Fix for lib.rs:')
    console.log('   1. Verify the discriminator matches CreateMetadataAccountV3')
    console.log('   2. Use mpl-token-metadata crate for proper instruction building')
    console.log('   3. Ensure account list matches Metaplex expectations:')
    console.log('      - metadata_account (writable)')
    console.log('      - mint (readonly)')
    console.log('      - mint_authority (signer)')
    console.log('      - payer (writable, signer)')
    console.log('      - update_authority (signer)')  
    console.log('      - system_program (readonly)')
    console.log('      - rent (readonly)')

    // Check the mint account info
    const mintAccount = await connection.getAccountInfo(mintPubkey)
    if (mintAccount) {
      console.log('\n📊 Mint Account Info:')
      console.log('   Owner:', mintAccount.owner.toString())
      console.log('   Lamports:', mintAccount.lamports)
      console.log('   Data length:', mintAccount.data.length)
    }

    console.log('\n✨ Use this information to fix the initialize_metadata instruction in lib.rs')
    
  } catch (error) {
    console.error('❌ Error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

// Also export helper functions for other scripts
export { loadWallet, MINT_ADDRESS, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_URI }

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createMetadataWithMetaplex()
}
