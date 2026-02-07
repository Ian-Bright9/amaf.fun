import { Connection, PublicKey } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const AUTHORITY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg')
const PROGRAM_ID = 'DGnE4VRytTjTfghAdvUosZoF7bDYetXSEX6WeYF2LeUe'

async function main() {
  try {
    // Calculate the user_markets_counter PDA
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_markets'), AUTHORITY.toBuffer()],
      new PublicKey(PROGRAM_ID)
    )
    
    console.log('User Markets Counter PDA:', counterPda.toBase58())
    
    // Try to fetch the account
    const accountInfo = await connection.getAccountInfo(counterPda)
    
    if (accountInfo === null) {
      console.log('Counter account does NOT exist - this is expected for first market')
    } else {
      console.log('Counter account EXISTS!')
      console.log('  Owner:', accountInfo.owner.toBase58())
      console.log('  Owner matches program:', accountInfo.owner.toBase58() === PROGRAM_ID)
      console.log('  Data length:', accountInfo.data.length)
      
      // Try to read count (authority + 4 bytes)
      if (accountInfo.data.length >= 40) {
        const count = accountInfo.data.readUInt16LE(40)
        console.log('  Count:', count)
      }
    }
    
    // Check what market PDAs would be created
    const marketIndex = 0
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), AUTHORITY.toBuffer(), Buffer.from(new Uint16Array([marketIndex]).buffer)],
      new PublicKey(PROGRAM_ID)
    )
    
    console.log('\nMarket PDA for index 0:', marketPda.toBase58())
    const marketInfo = await connection.getAccountInfo(marketPda)
    
    if (marketInfo === null) {
      console.log('Market 0 does NOT exist - good for new market')
    } else {
      console.log('Market 0 EXISTS!')
      console.log('  Owner:', marketInfo.owner.toBase58())
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
