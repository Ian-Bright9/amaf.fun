import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { getProgram, getMarketPDA } from '../src/data/markets'
import { getMintPDA, getUserMarketsCounterPDA } from '../src/data/tokens'
import idl from '../src/lib/idl/amafcoin.json'

const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

async function main() {
  console.log('=== Testing with Fresh Wallet ===\n')
  
  // Generate fresh keypair
  const freshKeypair = Keypair.generate()
  console.log('Fresh wallet:', freshKeypair.publicKey.toBase58())
  
  // Setup wallet adapter
  const wallet = new Wallet(freshKeypair)
  const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
  const program = new Program(idl as any, provider)
  
  console.log('Program ID:', program.programId.toBase58())
  
  // Request airdrop
  try {
    const airdropSig = await connection.requestAirdrop(
      freshKeypair.publicKey,
      2 * LAMPORTS_PER_SOL
    )
    console.log('\nAirdrop requested:', airdropSig)
    await connection.confirmTransaction(airdropSig)
    
    const balance = await connection.getBalance(freshKeypair.publicKey)
    console.log('Wallet balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL')
    
    // Test market creation
    const marketIndex = 0
    const question = 'Will this test work?'
    const description = 'Testing with fresh wallet'
    const options = ['YES', 'NO']
    
    const [counterPda] = getUserMarketsCounterPDA(freshKeypair.publicKey)
    const [mintPda] = getMintPDA()
    const [marketPda] = getMarketPDA(freshKeypair.publicKey, marketIndex)
    
    console.log('\n=== Creating Market ===')
    console.log('Counter PDA:', counterPda.toBase58())
    console.log('Market PDA:', marketPda.toBase58())
    console.log('Mint PDA:', mintPda.toBase58())
    
    // Check if counter exists (shouldn't for fresh wallet)
    const counterInfo = await connection.getAccountInfo(counterPda)
    console.log('Counter exists:', counterInfo !== null)
    
    // Try to create market
    const tx = await program.methods
      .createMarket(marketIndex, question, description, options)
      .accounts({
        market: marketPda,
        userMarketsCounter: counterPda,
        authority: freshKeypair.publicKey,
        mint: mintPda,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .rpc()
    
    console.log('\n✓ Market created successfully!')
    console.log('Transaction:', tx)
    console.log('Explorer: https://explorer.solana.com/tx/' + tx + '?cluster=devnet')
    
    // Verify the market was created
    const marketAccount = await (program.account as any).market.fetch(marketPda)
    console.log('\n=== Market Verified ===')
    console.log('Question:', marketAccount.question)
    console.log('Authority:', marketAccount.authority.toString())
    console.log('Market Index:', marketAccount.marketIndex)
    console.log('Number of options:', marketAccount.options.length)
    
    console.log('\n=== SUCCESS ===')
    console.log('\nYou can now use this fresh wallet in your browser to create markets!')
    console.log('Export the private key to import into your wallet:')
    console.log(JSON.stringify(Array.from(freshKeypair.secretKey)))
    
  } catch (err) {
    console.error('\n=== ERROR ===')
    console.error('Error:', err)
    
    if (err instanceof Error) {
      console.error('Message:', err.message)
      console.error('Stack:', err.stack)
    }
    process.exit(1)
  }
}

main()
