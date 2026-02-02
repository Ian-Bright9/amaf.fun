import { Connection, Keypair, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { setMintAuthority } from '../src/data/tokens'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'
import { readFileSync } from 'fs'
import idl from '../src/lib/idl/amafcoin.json'

const PROGRAM_ID = 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW'
const USER_WALLET = 'Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg'
const MINT_PDA = '6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG'
const METADATA_URI = 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/main/public/amafcoin-metadata.json'

const connection = new Connection(clusterApiUrl('devnet'))

async function main() {
  console.log('🪙 Starting AMAF Coin metadata creation...\n')

  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf-8')))
  )

  const walletAdapter = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => {
      tx.sign([keypair])
      return tx
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach(tx => tx.sign([keypair]))
      return txs
    },
    signMessage: async (message: Uint8Array) => {
      throw new Error('signMessage not implemented')
    },
    signAllMessages: async (messages: Uint8Array[]) => {
      throw new Error('signAllMessages not implemented')
    }
  }
  const provider = new AnchorProvider(connection, walletAdapter as any, { commitment: 'confirmed' })

  try {
    console.log('📋 Step 1: Setting mint authority to your wallet...')
    const program = new Program(idl as any, provider)
    const mintPda = PublicKey.findProgramAddressSync([Buffer.from('mint')], new PublicKey(PROGRAM_ID))[0]
    const programAuthorityPda = PublicKey.findProgramAddressSync([Buffer.from('authority')], new PublicKey(PROGRAM_ID))[0]

    const tx = await program.methods
      .setMintAuthority(new PublicKey(USER_WALLET))
      .accounts({
        mint: mintPda,
        programAuthority: programAuthorityPda,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()

    console.log('✅ Mint authority set successfully')
    console.log('Signature:', tx)
    console.log('')

    console.log('📋 Step 2: Creating metadata with Metaplex...')
    const metaplex = Metaplex.make(connection)
    const identity = keypairIdentity(keypair)
    metaplex.use(identity)

    const { nft } = await metaplex
      .nfts()
      .create({
        uri: METADATA_URI,
        name: 'AMAF Coin',
        symbol: 'AMAF',
        sellerFeeBasisPoints: 0,
        isMutable: true,
        useExistingMint: new PublicKey(MINT_PDA),
      })
    console.log('✅ Metadata created successfully')
    console.log('Metadata address:', nft.metadataAddress.toBase58())
    console.log('')

    console.log('📋 Step 3: Restoring mint authority to PDA...')
    const sig3 = await setMintAuthority(connection, walletAdapter as any, null)
    console.log('✅ Mint authority restored to PDA')
    console.log('Signature:', sig3)
    console.log('')

    console.log('🎉 All steps completed successfully!')
    console.log('\nMetadata is now live on devnet:')
    console.log(`Mint: ${MINT_PDA}`)
    console.log(`Metadata: ${nft.metadataAddress.toBase58()}`)
    console.log(`View on explorer: https://explorer.solana.com/address/${nft.metadataAddress.toBase58()}?cluster=devnet`)

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\nNote: If step 2 failed, authority may still be set to your wallet.')
    console.log('You may need to restore it manually with:')
    console.log('  await setMintAuthority(connection, wallet, null)')
    process.exit(1)
  }
}

main()
