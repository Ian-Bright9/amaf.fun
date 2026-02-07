import { Keypair } from '@solana/web3.js'

const keypair = Keypair.generate()
const secretKeyArray = Array.from(keypair.secretKey)

console.log('=== Fresh Wallet Generated ===\n')
console.log('Public Key (copy this):')
console.log(keypair.publicKey.toBase58())
console.log('\nPrivate Key (save this to import):')
console.log(JSON.stringify(secretKeyArray))
console.log('\n=== Instructions ===')
console.log('1. Copy the Public Key above')
console.log('2. Go to https://faucet.solana.com/')
console.log('3. Request airdrop to devnet')
console.log('4. Import the Private Key JSON array into Phantom/Backpack wallet')
console.log('5. Connect wallet to http://localhost:3001')
console.log('6. Try creating a market!')
