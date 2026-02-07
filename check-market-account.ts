import { Connection, PublicKey } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const MARKET_PDA = new PublicKey('DaFxhgZXJNxpMc2k3NEGgDoGmBHuZbU6vtoEPaY6ff3X')

async function main() {
  try {
    const accountInfo = await connection.getAccountInfo(MARKET_PDA)
    console.log('Account owner:', accountInfo.owner.toBase58())
    console.log('Data length:', accountInfo.data.length)
    console.log('First 8 bytes (discriminator):', Array.from(accountInfo.data.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '))
    console.log('Next 32 bytes (authority):', Array.from(accountInfo.data.slice(8, 40)).map(b => b).join(' '))
    
    // Try to read market_index as u16 (little endian)
    const marketIndex = accountInfo.data.readUInt16LE(40)
    console.log('Market index:', marketIndex)
    
    console.log('Full data hex:', accountInfo.data.toString('hex').substring(0, 200))
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
