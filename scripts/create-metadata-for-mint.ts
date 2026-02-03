#!/usr/bin/env tsx
/**
 * Create Metadata Account using Metaplex SDK
 * This creates metadata for the specified mint address directly
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'
import * as fs from 'fs'

// The mint that needs metadata
const MINT_ADDRESS = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG')

async function createMetadataAccount() {
  try {
    console.log('🔧 Creating metadata account using Metaplex SDK...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Load wallet
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())

    // Initialize Metaplex
    const metaplex = Metaplex.make(connection).use(keypairIdentity(walletKeypair))

    console.log('Mint:', MINT_ADDRESS.toString())

    // Derive the metadata PDA
    const metadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: MINT_ADDRESS })

    console.log('Metadata PDA:', metadataPDA.toString())
    console.log('\nThis should match:', metadataPDA.toString() === 'ELaAwEQsZJg5aLACpJdyYxgpoosbv9vHEYZCu8MmBbjF' ? '✓' : '✗')

    // Check if metadata already exists
    const existingMetadata = await connection.getAccountInfo(metadataPDA)
    if (existingMetadata) {
      console.log('\n⚠️  Metadata already exists!')
      console.log('Owner:', existingMetadata.owner.toString())
      return
    }

    // Create the metadata
    console.log('\nCreating metadata account...')
    const { nft } = await metaplex
      .nfts()
      .create({
        name: 'AMAF Coin',
        symbol: 'AMAF',
        uri: 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json',
        sellerFeeBasisPoints: 0,
        isMutable: true,
        mintAddress: MINT_ADDRESS,
      })

    console.log('\n✅ Metadata account created successfully!')
    console.log('Metadata address:', nft.metadataAddress.toString())
    console.log('Mint address:', nft.mintAddress.toString())
    console.log('\nExplorer: https://explorer.solana.com/address/' + nft.metadataAddress.toString() + '?cluster=devnet')

    return nft

  } catch (error) {
    console.error('\n❌ Error creating metadata account:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
    throw error
  }
}

createMetadataAccount()
  .then(() => {
    console.log('\n✅ Done! The metadata account now exists.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
