# Smart Contract Fix: PDA Signing for Claim Instructions

## Problem
Both `claim_daily_amaf` and `claim_payout` instructions were failing with:
```
Cross-program invocation with unauthorized signer or writable account
```

The error occurred because the program was making CPI (Cross-Program Invocation) calls without properly signing with the PDA (Program Derived Address) seeds.

## Root Cause
When a program calls another program (like the Token Program) and needs a PDA to "sign" the transaction, it must provide the PDA's seeds. The original code was missing the `.with_signer()` call.

## Changes Made

### 1. Fixed `claim_daily_amaf` (line 141-173)
**Before:**
```rust
token::mint_to(ctx.accounts.mint_ctx(), 100_000_000_000)?;
```

**After:**
```rust
// Create CPI accounts for mint_to
let cpi_accounts = MintTo {
    mint: ctx.accounts.mint.to_account_info(),
    to: ctx.accounts.user_token.to_account_info(),
    authority: ctx.accounts.program_authority.to_account_info(),
};

// Get the bump for the program_authority PDA
let bump = ctx.bumps.program_authority;

// Create signer seeds for the program_authority PDA
let seeds = &[&b"authority"[..], &[bump]];
let signer_seeds = &[&seeds[..]];

// Create CPI context with signer
let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
);

token::mint_to(cpi_ctx, 100_000_000_000)?;
```

### 2. Fixed `claim_payout` (line 84-138)
**Before:**
```rust
token::transfer(ctx.accounts.transfer_to_user(), payout)?;
```

**After:**
```rust
// Create CPI accounts for transfer from escrow to user
let cpi_accounts = Transfer {
    from: ctx.accounts.escrow_token.to_account_info(),
    to: ctx.accounts.user_token.to_account_info(),
    authority: ctx.accounts.market.to_account_info(),
};

// Get the bump for the market PDA
let bump = ctx.bumps.market;

// Create signer seeds for the market PDA
let seeds = &[
    &b"market"[..],
    ctx.accounts.market.authority.as_ref(),
    &[bump],
];
let signer_seeds = &[&seeds[..]];

// Create CPI context with signer
let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
);

token::transfer(cpi_ctx, payout)?;
```

### 3. Updated ClaimPayout Accounts (line 296-303)
**Before:**
```rust
#[account(mut)]
pub market: Account<'info, Market>,
```

**After:**
```rust
#[account(
    mut,
    seeds = [&b"market"[..], market.authority.as_ref()],
    bump
)]
pub market: Account<'info, Market>,
```

This change was necessary so the market PDA can be properly validated and its bump can be accessed via `ctx.bumps.market`.

## Build Status
✅ **Compiled Successfully** (with only warnings, no errors)

## Next Steps

### 1. Deploy Updated Program
The updated program needs to be deployed to devnet:

```bash
# Using Docker (recommended)
docker compose run --rm anchor anchor deploy

# Or using Anchor CLI directly if available
anchor deploy
```

### 2. Update IDL (if needed)
The IDL interface hasn't changed, but if you want to be thorough:

```bash
anchor idl build -p amafcoin
anchor idl upgrade --filepath target/idl/amafcoin.json <PROGRAM_ID>
```

### 3. Test the Fix
After deployment, test both claim functions:

1. **Daily AMAF Claim** - Should now work without the "unauthorized signer" error
2. **Payout Claim** - Should also work for resolved markets

## Files Modified
- `programs/amafcoin/src/lib.rs` - Smart contract logic

## Key Concepts
- **PDA (Program Derived Address)**: An account address derived from seeds and the program ID, owned by the program
- **CPI (Cross-Program Invocation)**: When one Solana program calls another program
- **PDA Signing**: PDAs can't sign directly, so the program provides the seeds to "sign" on behalf of the PDA
- **ctx.bumps**: Anchor provides the bump seeds for all PDA accounts in the context

## References
- Original error: `Cross-program invocation with unauthorized signer or writable account`
- Wallet address in error: `HrfWPEubmDdc7pTtmhFv3wzR24c7pEFzBbMnknfbB5hz` (this was the user account trying to sign instead of the PDA)
