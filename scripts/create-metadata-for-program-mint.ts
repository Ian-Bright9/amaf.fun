import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js'
import * as fs from 'fs'
import { getMintPDA, getProgramAuthorityPDA } from '../src/data/tokens'

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Discriminator for initialize_metadata from IDL
const DISCRIMINATOR = Buffer.from([35, 215, 241, 156, 122, 208, 206, 212])

// Helper to serialize strings
function serializeString(str: string): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32LE(str.length, 0)
  return Buffer.concat([len, Buffer.from(str)])
}

async function createMetadataForProgramMint() {
  try {
    console.log('🚀 Creating metadata for program mint...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Load wallet
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())

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

    // Prepare instruction data
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
        { pubkey: mintPda, isSigner: false, isWritable: true },
        { pubkey: authorityPda, isSigner: false, isWritable: true },
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
    console.log('\n✅ Metadata created successfully!')
    console.log('Transaction signature:', signature)
    console.log('\nMetadata address:', metadataPda.toString())
    console.log('Mint address:', mintPda.toString())
    console.log('Explorer: https://explorer.solana.com/address/' + metadataPda.toString() + '?cluster=devnet')

    return signature

  } catch (error) {
    console.error('\n❌ Error creating metadata:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
    throw error
  }
}

createMetadataForProgramMint()
  .then(() => {
    console.log('\n✅ Done! Program mint now has metadata.')
    console.log('You can now use the website to update metadata.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
