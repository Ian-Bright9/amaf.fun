#!/usr/bin/env tsx
/**
 * Create Metadata Account for Existing Mint
 * This manually calls Metaplex's CreateMetadataAccountV3 instruction
 */

import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js'
import * as fs from 'fs'

const MINT_ADDRESS = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG')
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Helper to serialize strings for Metaplex
function serializeString(str: string): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32LE(str.length, 0)
  return Buffer.concat([len, Buffer.from(str)])
}

// CreateMetadataAccountV3 instruction discriminator
const CREATE_METADATA_V3_DISCRIMINATOR = Buffer.from([173, 1, 251, 51, 196, 131, 191, 251])

async function createMetadataForExistingMint() {
  try {
    console.log('🔧 Creating metadata for existing mint...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Load wallet
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())
    console.log('Mint:', MINT_ADDRESS.toString())

    // Derive metadata PDA
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        MINT_ADDRESS.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )

    console.log('Metadata PDA:', metadataPda.toString())
    console.log('This should match ELaAwEQsZJg5aLACpJdyYxgpoosbv9vHEYZCu8MmBbjF:', 
      metadataPda.toString() === 'ELaAwEQsZJg5aLACpJdyYxgpoosbv9vHEYZCu8MmBbjF' ? '✓' : '✗')

    // Check if already exists
    const existingMetadata = await connection.getAccountInfo(metadataPda)
    if (existingMetadata) {
      console.log('\n✅ Metadata already exists!')
      console.log('Owner:', existingMetadata.owner.toString())
      console.log('Data length:', existingMetadata.data.length)
      return
    }

    // Prepare instruction data for CreateMetadataAccountV3
    const name = 'AMAF Coin'
    const symbol = 'AMAF'
    const uri = 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'
    const sellerFeeBasisPoints = 0

    // Serialize the data according to Metaplex format
    // discriminator + name + symbol + uri + seller_fee_basis_points + creators(collection, uses) + is_mutable + collection_details + edition nonce
    const nameBytes = serializeString(name)
    const symbolBytes = serializeString(symbol)
    const uriBytes = serializeString(uri)

    // Creators: none (0)
    const creatorsBytes = Buffer.from([0]) // 0 creators

    // Collection: none (1)
    const collectionBytes = Buffer.from([0]) // None variant

    // Uses: none (0)
    const usesBytes = Buffer.from([0]) // No uses

    // is_mutable: true (1)
    const isMutableBytes = Buffer.from([1])

    // collection_details: none (1)
    const collectionDetailsBytes = Buffer.from([1]) // None variant

    const instructionData = Buffer.concat([
      CREATE_METADATA_V3_DISCRIMINATOR,
      nameBytes,
      symbolBytes,
      uriBytes,
      Buffer.from([sellerFeeBasisPoints, 0]), // u16
      creatorsBytes,
      collectionBytes,
      usesBytes,
      isMutableBytes,
      collectionDetailsBytes,
    ])

    // Create the instruction
    // Accounts: metadata, mint, mint_authority, payer, update_authority, system_program, rent
    const ix = new TransactionInstruction({
      programId: TOKEN_METADATA_PROGRAM_ID,
      keys: [
        { pubkey: metadataPda, isSigner: false, isWritable: true },
        { pubkey: MINT_ADDRESS, isSigner: false, isWritable: false },
        { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: false }, // mint authority
        { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true }, // payer
        { pubkey: walletKeypair.publicKey, isSigner: false, isWritable: false }, // update authority
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    })

    // Create and send transaction
    const transaction = new Transaction().add(ix)
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = walletKeypair.publicKey

    console.log('\nSending transaction...')
    const signature = await connection.sendTransaction(transaction, [walletKeypair])
    console.log('Transaction sent:', signature)

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed')
    console.log('\n✅ Metadata account created successfully!')
    console.log('Transaction signature:', signature)
    console.log('\nMetadata address:', metadataPda.toString())
    console.log('Explorer: https://explorer.solana.com/address/' + metadataPda.toString() + '?cluster=devnet')

    return signature

  } catch (error) {
    console.error('\n❌ Error creating metadata account:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
    throw error
  }
}

createMetadataForExistingMint()
  .then(() => {
    console.log('\n✅ Done! The metadata account now exists and can be updated.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
