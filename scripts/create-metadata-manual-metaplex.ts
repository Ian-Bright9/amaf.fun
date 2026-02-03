import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js'
import * as fs from 'fs'
import { getMintPDA, getProgramAuthorityPDA } from '../src/data/tokens'

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

// Helper to serialize strings for Metaplex
function serializeString(str: string): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32LE(str.length, 0)
  return Buffer.concat([len, Buffer.from(str)])
}

// CreateMetadataAccountV3 instruction discriminator
const CREATE_METADATA_V3_DISCRIMINATOR = Buffer.from([173, 1, 251, 51, 196, 131, 191, 251])

async function createMetadataManual() {
  try {
    console.log('🚀 Creating metadata with manual Metaplex instruction...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    // Get PDAs
    const [mintPda] = getMintPDA()
    const [authorityPda] = getProgramAuthorityPDA()

    console.log('Program Mint:', mintPda.toString())
    console.log('Program Authority (current):', authorityPda.toString())

    // Get the private key for program authority PDA
    // We need to reconstruct the PDA seeds and create the signer
    // Seeds for program_authority: ["authority", bump]
    // We need to find the bump
    
    // Get the program authority account info to find the bump
    const authorityInfo = await connection.getAccountInfo(authorityPda)
    if (!authorityInfo) {
      throw new Error('Program authority PDA does not exist')
    }
    
    console.log('Program Authority account exists')
    
    // For PDAs, we can't sign with them unless we're in the program
    // The program's initialize_metadata function handles this internally
    // But it's failing, so let's try a different approach
    
    // Actually, we need to use the initialize_metadata function directly
    // But we need to figure out why it's failing
    
    // Let me check if the program authority has the right owner
    const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')
    console.log('Program ID:', PROGRAM_ID.toString())
    console.log('Authority owner:', authorityInfo.owner.toString())
    console.log('Authority is program:', authorityInfo.owner.equals(PROGRAM_ID) ? 'YES' : 'NO')

    // Check if mint has the right mint authority
    const mintInfo = await connection.getParsedAccountInfo(mintPda)
    if (mintInfo.value) {
      console.log('Mint authority:', mintInfo.value.data.parsed.info.mintAuthority)
      console.log('Is program authority:', mintInfo.value.data.parsed.info.mintAuthority === authorityPda.toString() ? 'YES' : 'NO')
    }

    // The issue is that we can't call Metaplex directly with program authority
    // We need to find the original creator or use a different approach
    
    console.log('\n⚠️  Cannot create metadata with current setup.')
    console.log('The mint authority is a PDA with no private key.')
    console.log('Metaplex requires the mint authority to sign the transaction.')
    console.log('\nSOLUTION: Use the program\'s initialize_metadata instruction, but first check')
    console.log('why it\'s failing by running it in a test or checking logs.')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  }
}

createMetadataManual()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
