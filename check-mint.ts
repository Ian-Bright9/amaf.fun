import { Connection, PublicKey } from '@solana/web3.js'

const PROGRAM_ID = 'BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn'
const connection = new Connection('https://api.devnet.solana.com')

async function main() {
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    new PublicKey(PROGRAM_ID)
  )

  try {
    const accountInfo = await connection.getAccountInfo(mintPda)
    console.log('Mint PDA:', mintPda.toString())
    console.log('Mint exists:', !!accountInfo)
    if (accountInfo) {
      console.log('Mint owner:', accountInfo.owner.toString())
      console.log('Mint data length:', accountInfo.data.length)
      console.log('Mint lamports:', accountInfo.lamports)
    }
  } catch (error) {
    console.error('Error checking mint:', error)
  }
}

main()
