#!/usr/bin/env tsx
/**
 * Create Metadata Account - Manual instruction construction
 */

import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js'
import * as fs from 'fs'
import { serialize } from 'borsh'

const MINT_ADDRESS = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG')
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')

// Calculate PDAs
const [programAuthorityPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('authority')],
  PROGRAM_ID
)

const [metadataPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    MINT_ADDRESS.toBuffer(),
  ],
  METADATA_PROGRAM_ID
)

// Helper to serialize strings
function serializeString(str: string): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32LE(str.length, 0)
  return Buffer.concat([len, Buffer.from(str)])
}

// Instruction discriminator for initialize_metadata from IDL
const DISCRIMINATOR = Buffer.from([35, 215, 241, 156, 122, 208, 206, 212])

async function createMetadataAccount() {
  try {
    console.log('🔧 Creating metadata account...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Load wallet
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())

    console.log('Mint:', MINT_ADDRESS.toString())
    console.log('Authority:', programAuthorityPda.toString())
    console.log('Metadata PDA:', metadataPda.toString())

    // Construct instruction data
    const name = 'AMAF Coin'
    const symbol = 'AMAF'
    const uri = 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'

    const nameBytes = serializeString(name)
    const symbolBytes = serializeString(symbol)
    const uriBytes = serializeString(uri)

    const instructionData = Buffer.concat([
      DISCRIMINATOR,
      nameBytes,
      symbolBytes,
      uriBytes,
    ])

    // Create the instruction
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: MINT_ADDRESS, isSigner: false, isWritable: true },
        { pubkey: programAuthorityPda, isSigner: false, isWritable: true },
        { pubkey: metadataPda, isSigner: false, isWritable: true },
        { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },
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
      console.error('\nStack:', error.stack)
    }
    throw error
  }
}

createMetadataAccount()
  .then(() => {
    console.log('\n✅ Done! The metadata account now exists and can be updated.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
