# Testing with Fresh Wallet

The issue is that your current wallet (`Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg`) has old accounts from the previous program deployment. These accounts can't be used with the new program because:

1. The PDAs are the same (same seeds + new program ID)
2. But the accounts have different structure (old program vs new program)
3. The new program expects the accounts to not exist (for `init_if_needed`)

## Solution: Use a Fresh Wallet

### Option 1: Generate a new keypair locally

Create a file `fresh-wallet.ts`:

```typescript
import { Keypair } from '@solana/web3.js'
import fs from 'fs'

const keypair = Keypair.generate()
const secretKeyArray = Array.from(keypair.secretKey)

console.log('=== Fresh Wallet Generated ===')
console.log('Public Key:', keypair.publicKey.toBase58())
console.log('\nSave this private key array to import into your wallet:')
console.log(JSON.stringify(secretKeyArray))
```

Run it:
```bash
npx tsx fresh-wallet.ts
```

Then import the JSON array into your Phantom/Backpack wallet (create new wallet from private key).

### Option 2: Use your browser wallet

1. In your wallet app, create a **NEW** wallet/account
2. Get the public key
3. Request devnet airdrop: https://faucet.solana.com/
4. Connect this new wallet to your dapp
5. Try creating a market

## What should happen

With a fresh wallet:
- `user_markets_counter` will NOT exist (good, creates fresh with new program)
- Market creation will succeed
- Verification will work immediately

## After confirming it works

Once you confirm market creation works with a fresh wallet, you can:
1. Use the new wallet as your main devnet wallet
2. Or I can add a migration script to close old accounts from your original wallet
