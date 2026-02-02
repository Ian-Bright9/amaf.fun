import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { readFileSync } from 'fs'

// Configuration
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const MINT_SEED = 'mint'

// Token details
const TOKEN_NAME = 'AMAF Coin'
const TOKEN_SYMBOL = 'AMAF'
const TOKEN_URI = 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'

function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MINT_SEED)],
    PROGRAM_ID
  )
}

function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )
}

async function createMetadataAccount() {
  try {
    const provider = AnchorProvider.env()
    
    console.log('Provider wallet:', provider.wallet.publicKey.toString())
    console.log('Provider URL:', provider.connection.rpcEndpoint)

    const [mintPda] = getMintPDA()
    const [metadataPda] = getMetadataPDA(mintPda)

    console.log('\nMint PDA:', mintPda.toString())
    console.log('Metadata PDA:', metadataPda.toString())

    // Check if mint exists
    const mintInfo = await provider.connection.getAccountInfo(mintPda)
    if (!mintInfo) {
      console.error('❌ Mint does not exist!')
      console.log('Please ensure the mint is initialized first.')
      process.exit(1)
    }
    console.log('✅ Mint exists')

    // Check if metadata already exists
    const metadataInfo = await provider.connection.getAccountInfo(metadataPda)
    if (metadataInfo) {
      console.log('✅ Metadata account already exists!')
      console.log('View on Solana Explorer:')
      console.log(`https://explorer.solana.com/address/${metadataPda.toString()}?cluster=devnet`)
      return
    }

    console.log('\n⚠️  IMPORTANT: This approach requires the program to have an initialize_metadata instruction.')
    console.log('Since we cannot upgrade the program due to funding constraints, we have two options:')
    console.log('\nOption A: Wait for devnet airdrop rate limit to reset (usually 24 hours)')
    console.log('Option B: Get devnet SOL from another source')
    console.log('\nAlternatively, we can create a simplified approach that creates metadata directly')
    console.log('without program changes, but this requires additional setup.')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createMetadataAccount()
