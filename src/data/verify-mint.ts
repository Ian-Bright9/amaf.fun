import { Connection, PublicKey } from '@solana/web3.js'

const PROGRAM_ID = 'BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn'

export async function verifyMintExists(): Promise<boolean> {
  const connection = new Connection('https://api.devnet.solana.com')

  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    new PublicKey(PROGRAM_ID)
  )

  try {
    const accountInfo = await connection.getAccountInfo(mintPda)
    console.log('Mint PDA:', mintPda.toString())
    console.log('Mint exists:', !!accountInfo)
    return !!accountInfo
  } catch (error) {
    console.error('Error checking mint:', error)
    return false
  }
}
