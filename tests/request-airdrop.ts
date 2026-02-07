import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const WALLET_PUBLIC_KEY = 'Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg'

async function main() {
  try {
    const walletPubkey = new PublicKey(WALLET_PUBLIC_KEY)
    
    // Request 1 SOL
    const airdropSig = await connection.requestAirdrop(
      walletPubkey,
      2 * LAMPORTS_PER_SOL
    )
    
    console.log('Airdrop requested:', airdropSig)
    
    // Wait for confirmation
    const { value: commitment } = await connection.getLatestBlockhash()
    await connection.confirmTransaction(airdropSig, commitment)
    
    // Check balance
    const balance = await connection.getBalance(walletPubkey)
    console.log('Wallet balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL')
    
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
