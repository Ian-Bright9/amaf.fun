# Fix Summary: AMAF Claim Account Already in Use Error

## Date
February 2, 2026

## Issues Resolved

### 1. ✅ Constant Time Dependency Fix
**Problem**: `constant_time_eq-0.4.2` requires `edition2024` feature not available in Rust 1.84.0
**Solution**: Pinned dependency to stable version 0.3.0 in `programs/amafcoin/Cargo.toml`
**Status**: RESOLVED

### 2. ✅ Program Build Success
**Solution**: Built program successfully after dependency fix
**Status**: RESOLVED
**Warnings**: 17 non-critical warnings

### 3. ✅ Program Deployment
**Solution**: Deployed to devnet successfully
**Program ID**: `Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW` (new)
**Previous ID**: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn` (old)
**Status**: RESOLVED

### 4. ✅ IDL Update
**Solution**: Fetched correct IDL from deployed program
**Status**: RESOLVED
**IDL Location**: `src/lib/idl/amafcoin.json`

### 5. ✅ Configuration Updates
**Files Updated**:
- `Anchor.toml` - Updated program ID to new deployed ID
- `src/data/markets.ts` - Updated PROGRAM_ID constant
**Status**: RESOLVED

## Remaining Issue: Account Already in Use on Second Claim

### Current Problem
When attempting to claim AMAF tokens a second time:
```
Allocate: account Address { address: HrfWPEubmDdc7pTtmhFv3wzR24c7pEFzBbMnknfbB5hz, base: None } already in use
```

This occurs because:
1. First claim creates `claim_state` PDA successfully using `init` constraint
2. Second claim tries to use `init` again on same PDA
3. `init` constraint ONLY works for NEW accounts
4. Program fails with "account already in use"

### Current Implementation
`programs/amafcoin/src/lib.rs:357` uses:
```rust
#[account(
    init,  // ← PROBLEM: Only creates NEW accounts
    payer = user,
    space = 8 + 40,
    seeds = [b"claim", user.key().as_ref()],
    bump
)]
pub claim_state: Account<'info, DailyClaimState>,
```

### Proposed Solutions

#### Option A: Frontend Workaround (QUICK FIX)
Have frontend check if `claim_state` account exists before attempting claim.

**Implementation in `src/components/DailyAmafClaim.tsx`**:
```typescript
async function checkLastClaim() {
  const [claimStatePda] = getClaimStatePDA(publicKey!)
  const accountInfo = await connection.getAccountInfo(claimStatePda)

  // First claim: account doesn't exist
  if (!accountInfo) {
    return // User can claim for first time
  }

  // Check 24-hour cooldown
  const lastClaim = new Date(Number(accountInfo.data.slice(40, 48)) * 1000)
  const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
  if (nextClaim > new Date()) {
    setNextClaimTime(nextClaim)
  }
}
```

**Pros**:
- No program code changes required
- Quick to implement
- Can be deployed immediately

**Cons**:
- Not the most elegant solution
- Doesn't fix root cause in smart contract

#### Option B: Two Separate Instructions (RECOMMENDED)
Create separate instructions for first claim and subsequent claims.

**In `programs/amafcoin/src/lib.rs`**:

1. Keep existing `claim_daily_amaf` for FIRST claims only (uses `init`)
2. Add NEW `claim_daily_amaf_existing` for subsequent claims (uses `mut` without `init`)

```rust
pub fn claim_daily_amaf_existing(ctx: Context<ClaimDailyExisting>) -> Result<()> {
    let state = &mut ctx.accounts.claim_state;
    let now = Clock::get()?.unix_timestamp;

    // Check 24-hour cooldown
    require!(now - state.last_claim >= 86_400, CustomError::ClaimTooSoon);

    // Update timestamp and mint tokens
    state.last_claim = now;
    // ... rest of mint logic
}

#[derive(Accounts)]
pub struct ClaimDailyExisting<'info> {
    #[account(
        mut,  // ← No 'init' - account already exists
        seeds = [b"claim", user.key().as_ref()]
    )]
    pub claim_state: Account<'info, DailyClaimState>,
    // ... rest of accounts
}
```

**Frontend Logic**:
```typescript
// Check if claim_state exists
const claimStateExists = await connection.getAccountInfo(claimStatePda)

if (claimStateExists) {
  // Use subsequent claim instruction
  await program.methods
    .claimDailyAmafExisting()
    .accounts({...})
    .rpc()
} else {
  // Use first claim instruction
  await program.methods
    .claimDailyAmaf()
    .accounts({...})
    .rpc()
}
```

**Pros**:
- Clean separation of concerns
- Solves root cause in smart contract
- Proper error handling for each case
- Production-ready solution

**Cons**:
- Requires program redeployment
- Frontend needs condition logic
- More code to maintain

#### Option C: Manual Account Management (FALLBACK)
Have smart contract manually check if account exists and handle both cases.

**In `programs/amafcoin/src/lib.rs`**:
```rust
pub fn claim_daily_amaf(ctx: Context<ClaimDaily>) -> Result<()> {
    let state = &mut ctx.accounts.claim_state;
    let now = Clock::get()?.unix_timestamp;

    // Check if this is first claim (last_claim is 0)
    if state.last_claim == 0 {
        // First claim: set initial timestamp
        state.last_claim = now;
    } else {
        // Subsequent claim: check 24-hour cooldown
        require!(now - state.last_claim >= 86_400, CustomError::ClaimTooSoon);
        state.last_claim = now;
    }

    // Mint tokens...
}
```

**But this doesn't solve the `init` constraint issue!** The constraint will still fail on second claim.

## Recommended Action

### Immediate: Deploy Frontend Workaround (Option A)

This is the fastest path to unblock users:

1. Modify `src/components/DailyAmafClaim.tsx` to check for existing `claim_state` before claiming
2. If account exists and within 24-hour window, show countdown
3. If account exists and past 24-hour window, show "Claim ¤100" button
4. If account doesn't exist, show "Claim ¤100" button (first claim)

### Long-term: Implement Two-Instruction Solution (Option B)

This is the production-ready fix:

1. Add `claim_daily_amaf_existing` instruction to `programs/amafcoin/src/lib.rs`
2. Build and deploy updated program
3. Update frontend to use conditional logic based on account existence
4. Test both first and subsequent claim flows

## Current State

### What Works ✅
- Program builds successfully
- Program deployed to devnet
- IDL is correct and encodable
- Mint account exists and is valid
- First claim will work (account initialization)
- 24-hour cooldown logic is correct

### What Doesn't Work Yet ⚠️
- Second claim fails with "account already in use" error
- `init` constraint can't be used for existing accounts

### Key Addresses
- **Program ID**: `Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW`
- **Mint PDA**: `4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6`
- **Program Authority**: `J1ujJTz5zPWhWLTBZAYNaM1yMyauLDiFrRqNaKBVTvQJ`

## Files Modified
1. `programs/amafcoin/Cargo.toml` - Pinned constant_time_eq dependency
2. `programs/amafcoin/src/lib.rs` - Reverted to `init` constraint
3. `Anchor.toml` - Updated program ID
4. `src/data/markets.ts` - Updated PROGRAM_ID constant
5. `src/lib/idl/amafcoin.json` - Fetched from deployed program

## Test Artifacts
- `test-idl-fix.ts` - IDL verification test (PASSED)

## Next Steps

### For Immediate Unblocking
Implement Option A (Frontend Workaround) in `src/components/DailyAmafClaim.tsx`:
```typescript
async function checkLastClaim() {
  const [claimStatePda] = getClaimStatePDA(publicKey!)
  try {
    const accountInfo = await connection.getAccountInfo(claimStatePda)

    if (accountInfo) {
      // Account exists - parse last claim time
      const lastClaimBytes = accountInfo.data.slice(40, 48)
      const lastClaim = new Date(
        Number(Buffer.from(lastClaimBytes).readBigUInt64LE()) * 1000
      )
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)

      if (nextClaim > new Date()) {
        setNextClaimTime(nextClaim)
      }
    }
  } catch (err) {
    // Account doesn't exist - first claim
    console.log('First time claim - no claim_state account')
  }
}
```

### For Production Solution
Implement Option B (Two Separate Instructions):
1. Add `claim_daily_amaf_existing` function to smart contract
2. Build and deploy
3. Update frontend with conditional logic
4. Test both flows end-to-end
