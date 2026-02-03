#!/usr/bin/env tsx
/**
 * Create Metadata Account Only
 * This script calls initialize_metadata to create the metadata PDA account.
 */

import * as anchor from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from '@solana/web3.js'
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

    // Create provider
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(walletKeypair),
      { commitment: 'confirmed' }
    )
    anchor.setProvider(provider)

    // Load the IDL from local file
    const idlPath = './target/idl/amafcoin.json'
    if (!fs.existsSync(idlPath)) {
      throw new Error(`IDL not found at ${idlPath}. Run 'docker compose run --rm anchor anchor build' first.`)
    }

    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'))
    const program = new anchor.Program(idl, PROGRAM_ID, provider)

    // Get PDAs
    const [mintPda] = getMintPDA()
    const [authorityPda] = getProgramAuthorityPDA()

    console.log('Mint:', mintPda.toString())
    console.log('Authority:', authorityPda.toString())

    // Derive metadata account PDA
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )

    console.log('Metadata PDA:', metadataPda.toString())

    // Call initialize_metadata
    console.log('\nCalling initialize_metadata instruction...')
    const tx = await program.methods
      .initializeMetadata('AMAF Coin', 'AMAF', 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json')
      .accounts({
        mint: mintPda,
        programAuthority: authorityPda,
        metadataAccount: metadataPda,
        payer: walletKeypair.publicKey,
        metadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc()

    console.log('\n✅ Metadata account created successfully!')
    console.log('Transaction signature:', tx)
    console.log('\nMetadata address:', metadataPda.toString())
    console.log('Explorer: https://explorer.solana.com/address/' + metadataPda.toString() + '?cluster=devnet')

    return tx

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
