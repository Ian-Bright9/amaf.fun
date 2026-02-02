import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'
import * as fs from 'fs'
import { getMintPDA } from '../src/data/tokens'

async function createMetadataForProgramMint() {
  try {
    console.log('🚀 Creating metadata using Metaplex SDK for program mint...\n')

    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    // Load wallet
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    console.log('Wallet:', walletKeypair.publicKey.toString())

    // Get program mint
    const [mintPda] = getMintPDA()
    console.log('Program Mint:', mintPda.toString())

    // Check mint info
    const mintInfo = await connection.getParsedAccountInfo(mintPda)
    if (!mintInfo.value) {
      throw new Error('Program mint does not exist')
    }
    
    console.log('  Mint Authority:', mintInfo.value.data.parsed.info.mintAuthority)
    console.log('  Supply:', mintInfo.value.data.parsed.info.supply)

    // Initialize Metaplex
    const metaplex = Metaplex.make(connection).use(keypairIdentity(walletKeypair))

    // Derive the metadata PDA
    const metadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintPda })

    console.log('Metadata PDA:', metadataPDA.toString())

    // Check if metadata already exists
    const existingMetadata = await connection.getAccountInfo(metadataPDA)
    if (existingMetadata) {
      console.log('\n✅ Metadata already exists!')
      console.log('Owner:', existingMetadata.owner.toString())
      console.log('Data length:', existingMetadata.data.length)
      return
    }

    console.log('\nCreating metadata account...')
    
    // Try to create metadata - this will fail if mint authority is not this wallet
    const { nft } = await metaplex
      .nfts()
      .create({
        name: 'AMAF Coin',
        symbol: 'AMAF',
        uri: 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json',
        sellerFeeBasisPoints: 0,
        isMutable: true,
        useNewMint: false, // Use existing mint
        mintAddress: mintPda,
      })

    console.log('\n✅ Metadata created successfully!')
    console.log('Metadata address:', nft.metadataAddress.toString())
    console.log('Mint address:', nft.mintAddress.toString())
    console.log('\nExplorer: https://explorer.solana.com/address/' + nft.metadataAddress.toString() + '?cluster=devnet')

    return nft

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
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.log('\n⚠️  Failed to create metadata with Metaplex SDK.')
    console.log('This is expected if mint authority is not the wallet signing the transaction.')
    console.log('The mint authority is the program authority PDA, not a wallet.')
    process.exit(1)
  })
