#!/usr/bin/env tsx
/**
 * Check Metadata Script
 * 
 * Checks if metadata exists for the AMAF token and displays relevant information.
 * Uses Metaplex SDK for accurate metadata PDA derivation.
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Metaplex } from '@metaplex-foundation/js'

const MINT_ADDRESS = '6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG'
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

async function checkMetadata() {
  try {
    console.log('🔍 Checking metadata status...\n')

    // Setup connection
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    
    // Initialize Metaplex (read-only, no wallet needed)
    const metaplex = Metaplex.make(connection)
    
    const mintPubkey = new PublicKey(MINT_ADDRESS)
    
    // Get metadata PDA using Metaplex
    const metadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintPubkey })
    
    console.log('📍 Token Information:')
    console.log('   Mint Address:', MINT_ADDRESS)
    console.log('   Metadata PDA:', metadataPDA.toString())
    console.log()

    // Check if metadata account exists
    const metadataAccount = await connection.getAccountInfo(metadataPDA)
    
    if (metadataAccount) {
      console.log('✅ Metadata account EXISTS')
      console.log('   Account Size:', metadataAccount.data.length, 'bytes')
      console.log('   Owner:', metadataAccount.owner.toString())
      
      if (metadataAccount.owner.equals(METADATA_PROGRAM_ID)) {
        console.log('   ✓ Correctly owned by Metaplex Token Metadata program')
      } else {
        console.log('   ⚠️  WARNING: Not owned by Metaplex program!')
      }

      console.log('\n🔗 Explorer Links:')
      console.log(`   Mint: https://explorer.solana.com/address/${MINT_ADDRESS}?cluster=devnet`)
      console.log(`   Metadata: https://explorer.solana.com/address/${metadataPDA.toString()}?cluster=devnet`)
      
      // Try to fetch and display metadata details
      try {
        const nft = await metaplex.nfts().findByMint({ mintAddress: mintPubkey })
        console.log('\n📋 Metadata Details:')
        console.log('   Name:', nft.name)
        console.log('   Symbol:', nft.symbol)
        console.log('   URI:', nft.uri)
        if (nft.json) {
          console.log('   Image:', nft.json.image || 'Not loaded')
        }
      } catch (e) {
        console.log('\n⚠️  Could not fetch detailed metadata (may be corrupted)')
      }
      
    } else {
      console.log('❌ Metadata account DOES NOT EXIST')
      console.log()
      console.log('📋 Status:')
      console.log('   ✓ Mint is initialized and functional')
      console.log('   ✗ Metadata is missing (for display purposes only)')
      console.log()
      console.log('💡 The token can still be used for:')
      console.log('   • Minting (daily claims)')
      console.log('   • Transferring')
      console.log('   • Betting in markets')
      console.log()
      console.log('⚠️  Missing metadata affects:')
      console.log('   • Wallet display (name, symbol, image)')
      console.log('   • Explorer visualization')
      console.log()
      console.log('🔧 To fix, you need to:')
      console.log('   1. Get devnet SOL for deployment')
      console.log('   2. Redeploy program with fixed initialize_metadata')
      console.log('   3. Call initialize_metadata with correct data format')
      console.log()
      console.log('🔗 Explorer Link:')
      console.log(`   Mint: https://explorer.solana.com/address/${MINT_ADDRESS}?cluster=devnet`)
    }

    // Check mint account
    const mintAccount = await connection.getAccountInfo(mintPubkey)
    if (mintAccount) {
      console.log('\n💰 Mint Account Status:')
      console.log('   ✓ Mint account exists')
      console.log('   Data Size:', mintAccount.data.length, 'bytes')
      console.log('   Executable:', mintAccount.executable)
    } else {
      console.log('\n❌ Mint account does not exist!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

checkMetadata()
