import * as anchor from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram, Keypair } from '@solana/web3.js'
import { getMintPDA, getProgramAuthorityPDA } from '../src/data/tokens'
import * as fs from 'fs'

const MINT_ADDRESS = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG')
const NEW_AUTHORITY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg')
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')

async function setMintAuthority() {
  try {
    console.log('🔧 Setting mint authority...\n')

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    // Load wallet
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())
    console.log('Mint:', MINT_ADDRESS.toString())
    console.log('New Authority:', NEW_AUTHORITY.toString())

    // Get PDAs
    const [authorityPda] = getProgramAuthorityPDA()
    console.log('Program Authority PDA:', authorityPda.toString())

    // Create provider
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(walletKeypair),
      { commitment: 'confirmed' }
    )
    anchor.setProvider(provider)

    // Load IDL and create program
    const idl = JSON.parse(fs.readFileSync('./target/idl/amafcoin.json', 'utf-8'))
    const program = new anchor.Program(idl, PROGRAM_ID, provider)

    // Call set_mint_authority
    console.log('\nCalling set_mint_authority instruction...')
    const tx = await program.methods
      .setMintAuthority(NEW_AUTHORITY)
      .accounts({
        mint: MINT_ADDRESS,
        programAuthority: authorityPda,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()

    console.log('\n✅ Mint authority set successfully!')
    console.log('Transaction signature:', tx)
    console.log('\nNew authority:', NEW_AUTHORITY.toString())
    console.log('Explorer: https://explorer.solana.com/tx/' + tx + '?cluster=devnet')

    return tx

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
    console.log('\n✅ Done! You can now create metadata with the new authority.')
    process.exit(0)
  })
  .catch((error) => {
    process.exit(1)
  })
