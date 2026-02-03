import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js'
import * as fs from 'fs'

const MINT_ADDRESS = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG')
const NEW_AUTHORITY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg')
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

// Get program authority PDA
const [programAuthorityPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('authority')],
  PROGRAM_ID
)

// Discriminator for set_mint_authority from IDL
const DISCRIMINATOR = Buffer.from([67, 127, 155, 187, 100, 174, 103, 121])

async function setMintAuthority() {
  try {
    console.log('🔧 Setting mint authority manually...\n')

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    // Load wallet
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())
    console.log('Mint:', MINT_ADDRESS.toString())
    console.log('New Authority:', NEW_AUTHORITY.toString())
    console.log('Program Authority PDA:', programAuthorityPda.toString())

    // Serialize new_authority (Option<pubkey>)
    // Option is 1 byte (0 for None, 1 for Some) + pubkey if Some
    const newAuthorityBytes = Buffer.concat([
      Buffer.from([1]), // Some
      NEW_AUTHORITY.toBuffer(), // pubkey
    ])

    // Instruction data
    const instructionData = Buffer.concat([
      DISCRIMINATOR,
      newAuthorityBytes,
    ])

    console.log('\nInstruction data length:', instructionData.length)

    // Create instruction
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: MINT_ADDRESS, isSigner: false, isWritable: true },
        { pubkey: programAuthorityPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
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
    console.log('\n✅ Mint authority set successfully!')
    console.log('Transaction signature:', signature)
    console.log('\nNew authority:', NEW_AUTHORITY.toString())
    console.log('Explorer: https://explorer.solana.com/tx/' + signature + '?cluster=devnet')

    return signature

  } catch (error) {
    console.error('\n❌ Error setting mint authority:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
    throw error
  }
}

setMintAuthority()
  .then(() => {
    console.log('\n✅ Done! You can now create metadata with the new authority wallet.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
