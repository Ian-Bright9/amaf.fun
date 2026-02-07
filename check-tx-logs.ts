import { Connection } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
const TX_SIG = '4G8QtvCJ4qb4ffom2omxkd41QE9WDjH2guuh7XJ45Dm7547mxQVoZWxaYiKUYdhcH7EBV8dnTNXF9tj4P7ZMqR2p'

async function main() {
  try {
    const tx = await connection.getTransaction(TX_SIG, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    })
    
    if (tx) {
      console.log('Transaction status:', tx.meta?.err || 'Success')
      console.log('\nLog messages:')
      if (tx.meta?.logMessages) {
        tx.meta.logMessages.forEach((log, i) => {
          console.log(`  [${i}]: ${log}`)
        })
      }
      
      if (tx.transaction && 'innerInstructions' in tx.meta) {
        console.log('\nInner instructions:')
        const innerIx = tx.meta.innerInstructions as any[] | undefined
        if (innerIx && innerIx[2]) {
          console.log('  Program instruction data:', (innerIx[2].instructions as any[])[0]?.data)
        }
      }
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
