import { Connection } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import * as fs from 'fs'

const connection = new Connection('https://api.devnet.solana.com')
const PROGRAM_ID = 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW'

async function main() {
  try {
    const idl = await Program.fetchIdl(connection, PROGRAM_ID)
    fs.writeFileSync('deployed-idl-from-network.json', JSON.stringify(idl, null, 2))
    console.log('IDL fetched and saved to deployed-idl-from-network.json')
  } catch (err) {
    console.error('Error fetching IDL:', err)
    process.exit(1)
  }
}

main()
