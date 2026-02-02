# Metadata Creation Workflow

This guide explains how to create Metaplex token metadata for the AMAF coin using the new `set_mint_authority` instruction.

## Prerequisites
- Your devnet wallet: `Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg`
- Mint PDA: Already initialized at `6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG`

## The Workflow

### Step 1: Set Mint Authority to Your Wallet

Use the `setMintAuthority` function to temporarily transfer mint authority from the PDA to your wallet:

```typescript
import { setMintAuthority } from '@/data/tokens'

const signature = await setMintAuthority(
  connection,
  wallet,
  new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg')
)
```

This calls the `set_mint_authority` instruction in the Anchor program.

### Step 2: Create Metadata with Metaplex

Now that the mint authority is your wallet (not a PDA), you can use standard Metaplex tools to create metadata:

```typescript
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'

const metaplex = Metaplex.make(connection)
const wallet = // Your wallet adapter

metaplex.use(keypairIdentity(wallet))

const { nft } = await metaplex
  .nfts()
  .create({
    uri: 'https://your-metadata.json',
    name: 'AMAF Coin',
    symbol: 'AMAF',
    sellerFeeBasisPoints: 0,
    isMutable: true,
    mintAddress: new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG'),
    updateAuthority: wallet.publicKey,
  })
```

### Step 3: Set Mint Authority Back to PDA

After creating metadata, restore the PDA as the mint authority:

```typescript
const signature = await setMintAuthority(
  connection,
  wallet,
  null // Passing null sets authority back to PDA
)
```

## Why This Approach?

The PDA mint authority was causing issues with Metaplex's complex instruction data serialization. By:
1. Temporarily transferring authority to a regular wallet
2. Using standard Metaplex SDK tools
3. Transferring authority back to the PDA

We avoid the complex manual serialization and use well-tested Metaplex tools.

## Metadata JSON Example

```json
{
  "name": "AMAF Coin",
  "symbol": "AMAF",
  "description": "Prediction market platform token",
  "image": "https://example.com/amaf-image.png",
  "attributes": []
}
```

Upload this JSON to a decentralized storage service (like Arweave, IPFS, or your server) and use the URL in the `uri` parameter.

## Available Helper Functions

- `setMintAuthority(connection, wallet, newAuthority)` - Change mint authority
- `getMetadataPDA(mint)` - Get the metadata account address
- `getMintPDA()` - Get the mint PDA address
- `getProgramAuthorityPDA()` - Get the program authority PDA address
