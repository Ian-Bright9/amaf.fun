import { Connection, PublicKey } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const MARKET_PDA = new PublicKey('DaFxhgZXJNxpMc2k3NEGgDoGmBHuZbU6vtoEPaY6ff3X')

async function main() {
  try {
    const accountInfo = await connection.getAccountInfo(MARKET_PDA)
    const data = accountInfo.data
    
    console.log('=== Account Analysis ===\n')
    
    // Discriminator (8 bytes)
    const discriminator = data.slice(0, 8)
    console.log('Discriminator:', Array.from(discriminator).map(b => b.toString(16).padStart(2, '0')).join(' '))
    console.log('Expected: db be d5 37 00 e3 c6 9a')
    console.log('Match:', discriminator.equals(Buffer.from([0xdb, 0xbe, 0xd5, 0x37, 0x00, 0xe3, 0xc6, 0x9a])))
    
    // Authority (32 bytes, offset 8)
    const authority = new PublicKey(data.slice(8, 40))
    console.log('\nAuthority:', authority.toBase58())
    
    // Market Index (u16, offset 40)
    const marketIndex = data.readUInt16LE(40)
    console.log('Market Index:', marketIndex)
    console.log('Expected: 14')
    console.log('Match:', marketIndex === 14)
    
    // Bump (u8, offset 42)
    const bump = data[42]
    console.log('\nBump:', bump)
    
    // Market Type (enum, offset 43)
    const marketType = data[43]
    console.log('Market Type:', marketType, '(0=Binary, 1=MultiOption)')
    
    // Question string (offset 44)
    const questionLen = data.readUInt32LE(44)
    console.log('\nQuestion length:', questionLen)
    
    if (questionLen > 0) {
      const question = data.slice(48, 48 + questionLen).toString('utf8')
      console.log('Question:', question)
    }
    
    // Description string
    const descLen = data.readUInt32LE(48 + questionLen)
    console.log('\nDescription length:', descLen)
    
    if (descLen > 0) {
      const descStart = 52 + questionLen
      const desc = data.slice(descStart, descStart + descLen).toString('utf8')
      console.log('Description:', desc)
      
      // Resolved (bool, offset = descStart + descLen)
      const resolved = data[descStart + descLen]
      console.log('\nResolved:', resolved)
      
      // Outcome (enum, offset = descStart + descLen + 1)
      const outcome = data[descStart + descLen + 1]
      console.log('Outcome:', outcome, '(0=Unresolved, 1=Cancelled, 2=OptionWinner)')
    }
    
    // Options
    const optionsStart = descStart + descLen + 2
    console.log('\nOptions start offset:', optionsStart)
    
    // Options length (u8, offset = optionsStart)
    const numOptions = data[optionsStart]
    console.log('Number of options:', numOptions)
    
    // Options array
    for (let i = 0; i < numOptions && optionsStart + 1 + i * (8 + 4 + 50 + 1) < data.length; i++) {
      const optOffset = optionsStart + 1 + i * (8 + 4 + 50 + 1)
      const shares = data.readBigUInt64LE(optOffset)
      const nameLen = data.readUInt32LE(optOffset + 8)
      const name = data.slice(optOffset + 12, optOffset + 12 + nameLen).toString('utf8')
      const active = data[optOffset + 12 + nameLen] === 1
      
      console.log(`\nOption ${i}:`)
      console.log('  Shares:', shares.toString())
      console.log('  Name length:', nameLen)
      console.log('  Name:', name)
      console.log('  Active:', active)
    }
    
  } catch (err) {
    console.error('Error:', err)
    console.error(err.stack)
  }
}

main()
