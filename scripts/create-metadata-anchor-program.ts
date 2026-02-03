import * as anchor from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction } from '@solana/web3.js'
import { getMintPDA, getProgramAuthorityPDA } from '../src/data/tokens'
import * as fs from 'fs'

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')

async function createMetadataViaAnchor() {
  try {
    console.log('🚀 Creating metadata via Anchor program...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Load wallet
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

    // Load IDL directly from file
    const idlPath = './target/idl/amafcoin.json'
    if (!fs.existsSync(idlPath)) {
      throw new Error('IDL not found at ' + idlPath)
    }

    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'))
    
    // Get PDAs
    const [mintPda] = getMintPDA()
    const [authorityPda] = getProgramAuthorityPDA()

    console.log('Program Mint:', mintPda.toString())
    console.log('Program Authority:', authorityPda.toString())

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

    // Prepare accounts object
    const accounts = {
      mint: mintPda,
      programAuthority: authorityPda,
      metadataAccount: metadataPda,
      payer: walletKeypair.publicKey,
      metadataProgram: METADATA_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      rent: SYSVAR_RENT_PUBKEY,
    }

    // Call initialize_metadata directly via rpc
    console.log('\nCalling initialize_metadata...')
    const tx = await program.methods.initializeMetadata(
      'AMAF Coin',
      'AMAF',
      'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'
    ).accounts(accounts).rpc()

    console.log('\n✅ Metadata created successfully!')
    console.log('Transaction signature:', tx)
    console.log('\nMetadata address:', metadataPda.toString())
    console.log('Mint address:', mintPda.toString())
    console.log('Explorer: https://explorer.solana.com/address/' + metadataPda.toString() + '?cluster=devnet')

    return tx

  } catch (error) {
    console.error('\n❌ Error creating metadata:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
    throw error
  }
}

createMetadataViaAnchor()
  .then(() => {
    console.log('\n✅ Done! Program mint now has metadata.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
