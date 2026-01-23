# Fix Plan: AMAF Claim and Address Issues

## Problem Summary

### Issues Identified
1. **Claim Failed**: Frontend uses hardcoded placeholder address `7jFf6MvXzqjEzF9F5...` instead of:
   - Calculating **mint PDA** using seeds `["mint"]`
   - Calculating **user's Associated Token Account (ATA)** using `getAssociatedTokenAddress`

2. **Missing Token Account Utilities**: No proper calculation of Associated Token Accounts (ATA)

3. **Unverified Mint Status**: Unclear if mint account exists on devnet

4. **Warnings**: Punycode and localstorage warnings are dependency-level, not critical

---

## Phase 1: Verify Mint Status

### Action
Create verification script to check if mint PDA exists on devnet.

### File: `src/data/verify-mint.ts`

```typescript
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
```

### If Mint Doesn't Exist
Run initialization script before proceeding to other phases.

---

## Phase 2: Create Token Utilities Module

### File: `src/data/tokens.ts` (NEW)

### Purpose
Centralize all PDA and ATA calculations for reuse across components.

### Key Functions

#### 1. getMintPDA()
Calculate mint PDA from program ID
```typescript
export function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    PROGRAM_ID
  )
}
```

#### 2. getProgramAuthorityPDA()
Calculate authority PDA
```typescript
export function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    PROGRAM_ID
  )
}
```

#### 3. getUserTokenAccount()
Get user's ATA address
```typescript
import { getAssociatedTokenAddressSync } from '@solana/spl-token'

export function getUserTokenAccount(
  user: PublicKey,
  mint: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(mint, user)
}
```

#### 4. getEscrowTokenAccount()
Get market escrow ATA address
```typescript
export function getEscrowTokenAccount(
  market: PublicKey,
  mint: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(mint, market, true)
}
```

#### 5. getOrCreateUserTokenAccount()
Get or create user's ATA (with transaction instruction if needed)
```typescript
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { Transaction } from '@solana/web3.js'

export async function getOrCreateUserTokenAccount(
  user: PublicKey,
  mint: PublicKey,
  connection: Connection,
  payer: PublicKey
): Promise<{ address: PublicKey; instruction: TransactionInstruction | null }> {
  const ata = getAssociatedTokenAddressSync(mint, user)

  try {
    const accountInfo = await connection.getAccountInfo(ata)
    if (accountInfo) {
      return { address: ata, instruction: null }
    }
  } catch (error) {
    // Account doesn't exist, will create
  }

  const instruction = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    user,
    mint
  )

  return { address: ata, instruction }
}
```

#### 6. getClaimStatePDA()
Calculate claim state PDA
```typescript
export function getClaimStatePDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('claim'), user.toBuffer()],
    PROGRAM_ID
  )
}
```

### Implementation Details
- Import functions from `@solana/spl-token`:
  - `getAssociatedTokenAddressSync`
  - `createAssociatedTokenAccountInstruction`
  - `createAssociatedTokenAccountIdempotentInstruction`
- Use correct program IDs:
  - Token Program: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
  - ATA Program: `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`
- Handle case where ATA doesn't exist yet (return null instruction or creation instruction)

---

## Phase 3: Update Markets Data Module

### File: `src/data/markets.ts`

### Changes

#### 1. Export PROGRAM_ID Constant
```typescript
export const PROGRAM_ID = new PublicKey(idl.address)
```

#### 2. Add Helper Functions
```typescript
export function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    PROGRAM_ID
  )
}

export function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    PROGRAM_ID
  )
}
```

#### 3. Ensure PDA Calculations Match Initialize-Mint
All PDA calculations must use the same seeds and approach as `initialize-mint.ts`:
- Mint: `["mint"]`
- Authority: `["authority"]`
- Market: `["market", authority]`
- Bet: `["bet", market, user]`
- Claim: `["claim", user]`

---

## Phase 4: Fix DailyAmafClaim Component

### File: `src/components/DailyAmafClaim.tsx`

### Changes

#### 1. Remove Hardcoded Address
**Line 95**: Remove `new PublicKey('7jFf6MvXzqjEzF9F5...')`

#### 2. Add Imports
```typescript
import { getMintPDA, getProgramAuthorityPDA, getClaimStatePDA, getOrCreateUserTokenAccount } from '@/data/tokens'
```

#### 3. Remove Unused Imports
- Remove `Link` import (unused)
- Remove `Keypair` import (unused)

#### 4. Update checkLastClaim()
Replace lines 36-39:
```typescript
// Before:
const [claimStatePda] = PublicKey.findProgramAddressSync(
  [Buffer.from('claim'), publicKey!.toBuffer()],
  new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn')
)

// After:
const [claimStatePda] = getClaimStatePDA(publicKey)
```

#### 5. Update handleClaim()

**Replace Line 95** (mint address):
```typescript
// Before:
const mintAddress = new PublicKey('7jFf6MvXzqjEzF9F5...')

// After:
const [mintAddress] = getMintPDA()
```

**Replace Lines 90-93** (claim state PDA):
```typescript
// Before:
const [claimStatePda] = PublicKey.findProgramAddressSync(
  [Buffer.from('claim'), publicKey.toBuffer()],
  new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn')
)

// After:
const [claimStatePda] = getClaimStatePDA(publicKey)
```

**Replace Lines 101-102** (authority and user token):
```typescript
// Before:
programAuthority: new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn'),
userToken: await getUserTokenAccount(publicKey, mintAddress, connection),

// After:
const [authorityPda] = getProgramAuthorityPDA()
userToken: await getOrCreateUserTokenAccount(
  publicKey,
  mintAddress,
  connection,
  publicKey
).then(result => result.address),
```

#### 6. Handle ATA Creation
If `getOrCreateUserTokenAccount` returns an instruction, include it in the transaction before the claim instruction.

---

## Phase 5: Fix Market Creation Component

### File: `src/routes/markets/create.tsx`

### Changes

#### 1. Remove Hardcoded Address
**Line 59**: Remove `new PublicKey('7jFf6MvXzqjEzF9F5...')`

#### 2. Remove Unused Import
- Remove `Keypair` import (unused)

#### 3. Add Import
```typescript
import { getMintPDA } from '@/data/tokens'
```

#### 4. Update handleSubmit()

**Replace Line 59** (mint address):
```typescript
// Before:
const mintAddress = new PublicKey('7jFf6MvXzqjEzF9F5...')

// After:
const [mintAddress] = getMintPDA()
```

**Note**: User token account not needed for market creation.

---

## Phase 6: Fix Market Detail/Betting Component

### File: `src/routes/markets/$id.tsx`

### Changes

#### 1. Remove All Hardcoded Addresses
- **Line 79**: Mint address
- **Line 88**: Mint address (repeated)
- **Lines 291, 296, 303**: Stub function return values

#### 2. Remove Unused Import
- Remove `getMarketPDA` import (unused)

#### 3. Add Imports
```typescript
import {
  getMintPDA,
  getClaimStatePDA,
  getOrCreateUserTokenAccount,
  getEscrowTokenAccount
} from '@/data/tokens'
```

#### 4. Update handlePlaceBet()

**Replace Line 79** (mint address):
```typescript
// Before:
const mintAddress = new PublicKey('7jFf6MvXzqjEzF9F5...')

// After:
const [mintAddress] = getMintPDA()
```

**Replace Lines 90-91** (escrow token):
```typescript
// Before:
escrowToken: await getEscrowTokenAccount(new PublicKey(id), connection),

// After:
const escrowTokenAddress = getEscrowTokenAccount(new PublicKey(id), mintAddress)
```

**Replace Lines 84-86** (user token):
```typescript
// Before:
userToken: await getUserTokenAccount(publicKey, mintAddress, connection),

// After:
userToken: await getOrCreateUserTokenAccount(
  publicKey,
  mintAddress,
  connection,
  publicKey
).then(result => result.address),
```

#### 5. Handle ATA Creation
If `getOrCreateUserTokenAccount` returns an instruction:
- Add it to transaction before placeBet instruction
- If `getEscrowTokenAccount` needs creation (for new markets), add ATA creation instruction

#### 6. Remove Stub Functions
Delete the stub functions at lines 287-301:
- `getUserTokenAccount()` (now imported from tokens)
- `getEscrowTokenAccount()` (now imported from tokens)

#### 7. Update handleResolveMarket()
No changes needed (doesn't involve mint/ATA).

---

## Phase 7: Initialize Mint (If Needed)

### Prerequisites
- Solana CLI wallet configured
- Devnet SOL for fees (~0.001-0.005 SOL)

### Action

#### Option A: Using Anchor Version
```bash
npx ts-node initialize-mint.ts
```

#### Option B: Using Web3.js Version
```bash
node initialize-mint-web3.js
```

### Verification
After initialization, run verification script to confirm mint exists:
```bash
node -e "import('./src/data/verify-mint').then(m => m.verifyMintExists())"
```

---

## Phase 8: Testing Plan

### 1. Verify Mint Exists
Run verification script to check mint status.

### 2. Initialize Mint (if verification fails)
Run appropriate initialization script based on your setup.

### 3. Test Daily Claim
- Connect wallet
- Click "Claim 100 AMAF" button
- Verify transaction succeeds
- Verify countdown appears on subsequent attempts
- Check that user's token balance increases

### 4. Test Market Creation
- Navigate to `/markets/create`
- Enter question and description
- Click "Create Market"
- Verify transaction succeeds
- Navigate to `/markets` to see new market

### 5. Test Betting
- Navigate to a market
- Enter bet amount
- Select YES or NO
- Click "Place Bet"
- Verify tokens are transferred correctly
- Check that market's YES/NO pools update

### 6. Test Market Resolution
- As market authority, click "YES Wins" or "NO Wins"
- Verify transaction succeeds
- Confirm market shows resolved status

### 7. Test Payout Claims
- Place a bet on a market
- Resolve market with winning outcome
- Navigate back to market
- Click "Claim Payout" (if implemented)
- Verify payout is received

---

## Phase 9: Address Warnings (Optional)

### Current Warnings

#### Punycode Deprecation
- **Source**: `@solana/web3.js` dependency
- **Severity**: Non-critical
- **Action**: Ignore for now, will be fixed in future versions
- **Workaround**: None needed

#### --localstorage-file Warning
- **Source**: Phantom wallet configuration
- **Severity**: Non-critical
- **Action**: Ignore, doesn't affect functionality
- **Workaround**: Configure Phantom wallet properly if needed

### Recommendation
These warnings can be ignored for now. If they become disruptive:
1. File issue with `@solana/web3.js` for punycode warning
2. Check Phantom wallet configuration for localstorage warning

---

## Implementation Order

### Sequence
1. ✅ Create `src/data/tokens.ts` with all utility functions
2. ✅ Update `src/data/markets.ts` with PDA helpers
3. ✅ Fix `src/components/DailyAmafClaim.tsx`
4. ✅ Fix `src/routes/markets/create.tsx`
5. ✅ Fix `src/routes/markets/$id.tsx`
6. ✅ Create and run `src/data/verify-mint.ts` to check mint status
7. ✅ Initialize mint if needed (using existing scripts)
8. ✅ Test all functionality end-to-end

### Checklist
- [ ] Create tokens utility module
- [ ] Update markets data module
- [ ] Fix DailyAmafClaim component
- [ ] Fix Market Creation component
- [ ] Fix Market Detail component
- [ ] Verify mint status
- [ ] Initialize mint (if needed)
- [ ] Test daily claim
- [ ] Test market creation
- [ ] Test betting
- [ ] Test market resolution
- [ ] Test payout claims (if implemented)

---

## Success Criteria

### Functional Requirements
- ✅ Daily AMAF claim works successfully
- ✅ Markets can be created
- ✅ Bets can be placed
- ✅ Markets can be resolved
- ✅ Payouts can be claimed
- ✅ All addresses are calculated dynamically via PDA
- ✅ All ATAs are calculated properly
- ✅ No hardcoded addresses in codebase

### Code Quality Requirements
- ✅ Centralized token utilities in dedicated module
- ✅ Reusable functions across components
- ✅ Proper error handling for missing accounts
- ✅ Type safety maintained throughout

---

## Notes

### Smart Contract Integration
- All smart contract instructions are implemented and deployed
- IDL is generated at `src/lib/idl/amafcoin.json`
- Program ID: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn`
- Initialize-mint scripts already exist and work correctly

### Dependencies
- `@solana/spl-token@0.4.14` - Provides ATA functions
- `@solana/web3.js@1.98.4` - Core Solana SDK
- `@coral-xyz/anchor@0.31.1` - Anchor framework

### Next Steps After This Fix
- Consider implementing proper loading states for ATA creation
- Add transaction progress indicators for long operations
- Implement error recovery for failed transactions
- Add market betting history page
- Implement notifications for resolved markets
