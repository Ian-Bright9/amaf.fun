import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { readFileSync } from 'fs'
import { setMintAuthority } from '../src/data/tokens'

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')
const USER_WALLET = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg')

const connection = new Connection(clusterApiUrl('devnet'))
const keypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf-8')))
)

const wallet = {
  publicKey: keypair.publicKey,
  signTransaction: async (tx: any) => {
    tx.sign([keypair])
    return tx
  },
  signAllTransactions: async (txs: any) => {
    txs.forEach(tx => tx.sign([keypair]))
    return txs
  }
}

async function main() {
  console.log('Setting mint authority to:', USER_WALLET.toString())
  
  try {
    const signature = await setMintAuthority(
      connection,
      wallet,
      USER_WALLET
    )
    
    console.log('✓ Mint authority set successfully')
    console.log('Signature:', signature)
    console.log('\nNow you can create metadata using Metaplex tools.')
    console.log('After creating metadata, set authority back to null with:')
    console.log('  await setMintAuthority(connection, wallet, null)')
  } catch (error) {
    console.error('Error setting mint authority:', error)
    process.exit(1)
  }
}

main()
