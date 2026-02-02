# Mint Initialization Fix - Summary

## Problem
The mint PDA (`6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG`) did not exist on devnet, blocking all mint-based functionality (daily claims, markets, betting, payouts).

## Root Cause
Anchor 0.31.1 changed the instruction discriminator format from the old `sha256("global:instructionName")` method to a new format that uses pre-computed discriminators stored in the IDL.

## Solution Implemented

### 1. Fixed Anchor Safety Checks
Updated `programs/amafcoin/src/lib.rs` to add `/// CHECK:` doc comments for `program_authority` fields in both `InitializeMint` and `ClaimDaily` structs (required by Anchor 0.31.1 strict safety checks).

### 2. Built New IDL with Discriminators
Ran `anchor idl build -p amafcoin` to generate IDL with the new Anchor 0.31.1 format, which includes discriminators for each instruction.

### 3. Identified Correct Discriminator
From the generated IDL, found the discriminator for `initialize_mint`:
```javascript
[209, 42, 195, 4, 129, 85, 209, 44] // hex: d12ac3048155d12c
```

### 4. Successfully Initialized Mint
Created `init-mint-v6.ts` using the correct discriminator from the IDL, which successfully initialized the mint on devnet.

**Transaction Signature:** `27sAS1zSMRH9ZCSLS7CXKdviqe2CLg4N3RoJjLK3QydyVF84P6sxPApEv7aVV3zsup72grFHKPgJbicr7Brd1Anq`

## Verification
```bash
$ npx tsx check-mint.ts
Mint PDA: 6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG
Mint exists: true
Mint owner: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
Mint data length: 82
Mint lamports: 1461600
```

## Files Updated
1. `programs/amafcoin/src/lib.rs` - Added CHECK comments for program_authority fields
2. `src/lib/idl/amafcoin.json` - Updated with new Anchor 0.31.1 format IDL
3. `rust/idl.json` - Updated with new Anchor 0.31.1 format IDL
4. `init-mint-v6.ts` - Created successful mint initialization script

## Key Learnings
1. **Anchor 0.31.1 Discriminator Format**: The new format uses 8-byte pre-computed discriminators stored in the IDL, not `sha256("global:instructionName")`
2. **Build IDL First**: Always run `anchor idl build` to get the correct discriminators
3. **Safety Checks**: Anchor 0.31.1 requires `/// CHECK:` comments for unchecked accounts

## Impact
✅ Mint initialized on devnet
✅ Daily AMAF claims now possible
✅ Market creation now possible
✅ Betting functionality now possible
✅ Payout claims now possible

## Next Steps
1. Test Daily AMAF claim functionality with real wallet connection
2. Test Market creation flow end-to-end
3. Test Betting and Payout flows

## References
- Transaction: https://explorer.solana.com/tx/27sAS1zSMRH9ZCSLS7CXKdviqe2CLg4N3RoJjLK3QydyVF84P6sxPApEv7aVV3zsup72grFHKPgJbicr7Brd1Anq?cluster=devnet
- Mint Account: https://explorer.solana.com/address/6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG?cluster=devnet
- Program: https://explorer.solana.com/address/BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn?cluster=devnet
