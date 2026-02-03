#!/usr/bin/env tsx
/**
 * Create Metadata Account Using Anchor Program Instance
 */

import * as anchor from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction } from '@solana/web3.js'
import { getMintPDA, getProgramAuthorityPDA } from '../src/data/tokens'
import * as fs from 'fs'

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')

async function createMetadataAccount() {
  try {
    console.log('🔧 Creating metadata account...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Load wallet from default Solana config
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())

    // Get PDAs
    const [mintPda] = getMintPDA()
    const [authorityPda] = getProgramAuthorityPDA()

    // Derive metadata account PDA
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )

    console.log('Mint:', mintPda.toString())
    console.log('Authority:', authorityPda.toString())
    console.log('Metadata PDA:', metadataPda.toString())

    // Create the instruction manually
    const idl = JSON.parse(fs.readFileSync('./target/idl/amafcoin.json', 'utf-8'))
    
    const initializeMetadataIx = anchor.Program.defaultAccounts({
      programId: PROGRAM_ID,
      accounts: {
        mint: mintPda,
        programAuthority: authorityPda,
        metadataAccount: metadataPda,
        payer: walletKeypair.publicKey,
        metadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        rent: SYSVAR_RENT_PUBKEY,
      },
    }).instruction(
      idl.instructions.find((ix: any) => ix.name === 'initializeMetadata'),
      ['AMAF Coin', 'AMAF', 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json']
    )

    // Create and send transaction
    const transaction = new Transaction().add(initializeMetadataIx)
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

createMetadataAccount()
  .then(() => {
    console.log('\n✅ Done! The metadata account now exists and can be updated.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
