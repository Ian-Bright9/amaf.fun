#!/usr/bin/env tsx
/**
 * Validate Instruction Format Script
 * 
 * This script compares the current program's instruction format with
 * Metaplex's expected format to identify the serialization mismatch.
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Metaplex } from '@metaplex-foundation/js'
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata'

const MINT_ADDRESS = '6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG'
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const PAYER_WALLET = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW') // Placeholder

async function validateInstructionFormat() {
  try {
    console.log('🔬 Validating Metadata Instruction Format\n')
    
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const metaplex = Metaplex.make(connection)
    
    const mintPubkey = new PublicKey(MINT_ADDRESS)
    const metadataPDA = metaplex.nfts().pdas().metadata({ mint: mintPubkey })
    
    // Get the mint account to find the mint authority
    const mintAccount = await connection.getAccountInfo(mintPubkey)
    console.log('📍 Addresses:')
    console.log('   Mint:', MINT_ADDRESS)
    console.log('   Metadata PDA:', metadataPDA.toString())
    console.log()

    // Create a sample instruction using Metaplex SDK
    const instruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintPubkey,
        mintAuthority: metadataPDA, // Placeholder - would be the actual PDA
        payer: PAYER_WALLET,
        updateAuthority: PAYER_WALLET,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: 'AMAF Coin',
            symbol: 'AMAF',
            uri: 'https://example.com/metadata.json',
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    )

    console.log('📋 Metaplex SDK Instruction Analysis:')
    console.log('   Program ID:', instruction.programId.toString())
    console.log('   Data Length:', instruction.data.length, 'bytes')
    console.log()
    
    // Analyze the instruction data
    const data = instruction.data
    console.log('📊 Instruction Data Breakdown:')
    console.log('   First 8 bytes (discriminator):', Array.from(data.slice(0, 8)))
    console.log('   Expected discriminator:      [33, 15, 223, 89, 229, 234, 172, 153]')
    
    const expectedDiscriminator = [33, 15, 223, 89, 229, 234, 172, 153]
    const actualDiscriminator = Array.from(data.slice(0, 8))
    const discriminatorMatch = expectedDiscriminator.every((val, i) => val === actualDiscriminator[i])
    
    console.log('   Discriminator Match:', discriminatorMatch ? '✅ YES' : '❌ NO')
    console.log()

    // Accounts analysis
    console.log('📋 Account List (from Metaplex SDK):')
    instruction.keys.forEach((key, index) => {
      const signer = key.isSigner ? '(signer)' : ''
      const writable = key.isWritable ? '(writable)' : ''
      console.log(`   ${index}. ${key.pubkey.toString()} ${signer} ${writable}`)
    })
    console.log()

    // Compare with current program implementation
    console.log('🔍 COMPARISON WITH CURRENT PROGRAM IMPLEMENTATION:')
    console.log()
    console.log('Program Implementation (lib.rs):')
    console.log('  Discriminator: [33, 15, 223, 89, 229, 234, 172, 153]')
    console.log('  Accounts: [metadata, mint, mint_authority, payer, update_authority, system, rent]')
    console.log('  Data: Custom Borsh serialization')
    console.log()
    console.log('Metaplex SDK (Correct Implementation):')
    console.log(`  Discriminator: [${actualDiscriminator.join(', ')}]`)
    console.log('  Accounts: Same order as above')
    console.log('  Data: Proper Borsh serialization via mpl-token-metadata')
    console.log()

    // Serialization analysis
    console.log('🔬 Serialization Analysis:')
    console.log('  Data after discriminator (hex):', data.slice(8).toString('hex').match(/.{1,2}/g)?.join(' '))
    console.log()
    console.log('  Expected serialization format:')
    console.log('    - name: string (4 bytes length prefix + chars)')
    console.log('    - symbol: string (4 bytes length prefix + chars)')
    console.log('    - uri: string (4 bytes length prefix + chars)')
    console.log('    - seller_fee_basis_points: u16')
    console.log('    - creators: Option<Vec<Creator>>')
    console.log('    - collection: Option<Collection>')
    console.log('    - uses: Option<Uses>')
    console.log('    - is_mutable: bool')
    console.log('    - collection_details: Option<CollectionDetails>')
    console.log()
    
    // Show raw data bytes for debugging
    console.log('📝 Raw Instruction Data (first 100 bytes):')
    const hexData = data.slice(0, 100).toString('hex')
    const formatted = hexData.match(/.{1,2}/g)?.join(' ')
    console.log('  ', formatted)
    console.log()

    console.log('💡 KEY FINDINGS:')
    if (!discriminatorMatch) {
      console.log('  ❌ Discriminator mismatch! Program uses wrong instruction ID.')
    } else {
      console.log('  ✅ Discriminator is correct')
    }
    console.log()
    console.log('  Likely Issues:')
    console.log('  1. Data struct fields may not match Metaplex spec exactly')
    console.log('  2. Borsh serialization may be different (especially Option<T>)')
    console.log('  3. String encoding differences (UTF-8 vs other)')
    console.log('  4. Optional field handling (Some vs None variants)')
    console.log()
    console.log('🔧 RECOMMENDATION:')
    console.log('  Use mpl-token-metadata Rust crate in the program instead of manual serialization:')
    console.log('  1. Add to Cargo.toml: mpl-token-metadata = "3.3"')
    console.log('  2. Replace manual instruction construction with:')
    console.log('     create_metadata_accounts_v3(...) from mpl_token_metadata')
    console.log('  3. This ensures 100% compatibility with Metaplex standard')

  } catch (error) {
    console.error('❌ Error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

validateInstructionFormat()
