import { Connection } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
const TX_SIG = '4G8QtvCJ4qb4ffom2omxkd41QE9WDjH2guuh7XJ45Dm7547mxQVoZWxaYiKUYdhcH7EBV8dnTNXF9tj4P7ZMqR2p'

async function main() {
  try {
    const tx = await connection.getParsedTransaction(TX_SIG)
    console.log('Transaction loaded')
    if (tx) {
      console.log('Message instructions:', tx.transaction.message.instructions.length)
      
      for (let i = 0; i < tx.transaction.message.instructions.length; i++) {
        const ix = tx.transaction.message.instructions[i]
        console.log(`\nInstruction ${i}:`)
        console.log('  Program ID:', ix.programId.toBase58())
        
        if (ix.programId.toBase58() === 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW') {
          console.log('  This is our program!')
          if (tx.meta && tx.meta.innerInstructions) {
            for (let j = 0; j < tx.meta.innerInstructions.length; j++) {
              const innerIxs = tx.meta.innerInstructions[j]
              if (innerIxs && innerIxs.instructions) {
                for (let innerIx of innerIxs.instructions) {
                  if (innerIx.programId === 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW') {
                    console.log('  Inner instruction:', innerIx.data)
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
