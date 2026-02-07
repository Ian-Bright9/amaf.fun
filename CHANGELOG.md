# CPMM Implementation Changelog

## Overview

This document describes the complete migration from **Parimutuel Pool Betting** to **Constant Product Market Maker (CPMM)** for the AMAF.FUN prediction market platform.

**Migration Type**: Clean Slate - No legacy market data preserved  
**Implementation Date**: February 2026  
**Phase Completion**: Phases 1-4 Complete

---

## Breaking Changes

### Smart Contract

#### Data Structures

**Market Struct**
```rust
// OLD (Parimutuel)
pub struct Market {
    pub total_yes: u64,
    pub total_no: u64,
    pub outcome: Option<bool>,  // true = YES, false = NO
}

// NEW (CPMM)
pub struct Market {
    pub market_type: MarketType,        // Binary or MultiOption
    pub outcome: Outcome,               // Cancelled or OptionWinner(u8)
    pub options: Vec<OptionData>,      // Array of options (2-16)
    pub num_options: u8,               // Current option count
    pub collateral_balance: u64,       // Total AMAF in pool
    pub virtual_liquidity: u64,        // L parameter (50)
    // Removed: total_yes, total_no, outcome: Option<bool>
}
```

**Bet Struct**
```rust
// OLD (Parimutuel)
pub struct Bet {
    pub amount: u64,           // Fixed bet amount
    pub side_yes: bool,        // true = YES, false = NO
}

// NEW (CPMM)
pub struct Bet {
    pub shares: u64,           // Number of shares owned
    pub option_index: u8,      // Which option (0-15)
    // Removed: amount, side_yes
}
```

#### New Enums

```rust
pub enum MarketType {
    Binary,        // 2 options (YES/NO)
    MultiOption,    // 2-16 custom options
}

pub enum Outcome {
    Unresolved,                 // Market is active
    Cancelled,                 // Market was cancelled
    OptionWinner(u8),           // Index of winning option
}
```

#### New Struct

```rust
pub struct OptionData {
    pub shares: u64,       // Shares issued for this option
    pub name: String,       // Option name (max 50 chars)
    pub active: bool,       // Whether option can be traded
}
```

### Instructions

#### Renamed

- `place_bet` → `buy_shares`
  - Changed from: Betting fixed amounts
  - Changed to: Buying shares at current price
  - New parameters: `shares: u64`, `option_index: u8`
  - Old parameters: `amount: u64`, `side_yes: bool`

#### Signatures Changed

**create_market**
```rust
// OLD
pub fn create_market(
    market_index: u16,
    question: String,
    description: String,
)

// NEW
pub fn create_market(
    market_index: u16,
    question: String,
    description: String,
    options: Vec<String>,  // NEW: Array of option names
)
```

**resolve_market**
```rust
// OLD
pub fn resolve_market(
    outcome_yes: bool,  // true = YES wins, false = NO wins
)

// NEW
pub fn resolve_market(
    winner_index: u8,  // Index of winning option (0-15)
)
```

**claim_payout**
```rust
// OLD: Parimutuel proportional payout
let winner_pool = if outcome_yes { market.total_yes } else { market.total_no };
bet.amount.checked_mul(total_pool).unwrap() / winner_pool

// NEW: Fixed payout per winning share
match market.outcome {
    Outcome::OptionWinner(winner_idx) => bet.shares / 10,  // 0.1 AMAF per share
    Outcome::Cancelled => (bet.shares / total_shares) * collateral_balance,
}
```

#### New Instructions

- **`add_option`**: Add new option to multi-option market
  - Only for multi-option markets
  - Market authority only
  - Maximum 16 options
  - Adds 50 virtual shares to new option

#### Account Space Changes

```rust
// OLD Market space
space = 8 + 32 + 2 + 1 + 4 + 200 + 4 + 500 + 1 + 1 + 8 + 8

// NEW Market space (accommodates up to 16 options)
space = 8 + 32 + 2 + 1 + 1 + 1 + 4 + 200 + 4 + 500
       + 1 + 1 + 1 + 8 + 8
       + (MAX_OPTIONS * (8 + 4 + 50 + 1))  // Option array
// Total: ~2600 bytes vs ~500 bytes (old)
```

### Frontend

#### TypeScript Interfaces

**Market Interface**
```typescript
// OLD
interface Market {
  outcome: boolean;           // true = YES, false = NO
  totalYes: bigint;
  totalNo: bigint;
}

// NEW
interface Market {
  marketType: MarketType;       // Binary | MultiOption
  outcome: Outcome;           // 'Unresolved' | 'Cancelled' | 'OptionWinner'
  options: OptionData[];       // Array of options
  numOptions: number;          // 2-16
  collateralBalance: bigint;    // Total tokens in pool
  virtualLiquidity: bigint;   // Always 50
  // Removed: outcome, totalYes, totalNo
}
```

#### New Utility File

**`src/lib/pricing.ts`** (NEW)
```typescript
// CPMM pricing calculations
export function getOptionPrices(options: OptionData[]): number[]
export function calculateBuyCost(
  shares: bigint,
  options: OptionData[],
  collateralBalance: bigint,
  targetIndex: number
): { costTokens: bigint; newOptions: OptionData[] }
export function calculatePotentialPayout(shares: bigint): number
export function formatPrice(price: number): string
```

#### UI Changes

**Create Market Page**
- Added market type selector (Binary / Multi-Option)
- Added dynamic options UI (add/remove options)
- Increased question limit: 100 → 200 characters
- New form field: Options array

**Market Detail Page**
- Removed: YES/NO toggle, fixed bet amount
- Added: Options grid (2-16 cards)
- Added: Option selection for buying
- Added: Live price display for all options
- Added: Cost preview calculation
- Added: Add option button (authority only)
- Added: Multi-option resolution dropdown
- Removed: Fixed YES/NO resolution buttons

**Market Listing Page**
- Added: Market type badges (Binary / 3 Options, etc.)
- Added: Options preview with prices
- Removed: YES/NO pool displays

---

## Preserved Features

The following features from the parimutuel implementation remain unchanged:

### UserMarketsCounter
- **Status**: ✅ Preserved
- **Changes**: None
- **Purpose**: Tracks sequential market index per user for PDA consistency

### cancel_market Instruction
- **Status**: ✅ Preserved with updates
- **Changes**: 
  - Updated to use `Outcome::Cancelled` enum
  - Old: `outcome: None`
  - New: `outcome: Outcome::Cancelled`
- **Behavior**: Same - cancels market, enables refunds

### claim_daily_amaf Instruction
- **Status**: ✅ Preserved
- **Changes**: None
- **Behavior**: Same - mints 100 tokens daily with 24h cooldown

### DailyClaimState Struct
- **Status**: ✅ Preserved
- **Changes**: None
- **Purpose**: Tracks last claim timestamp per user

### Market PDA Seeds
- **Status**: ✅ Preserved
- **Seeds**: `[b"market", authority, market_index]`
- **Changes**: None (same as parimutuel)

---

## Pricing Logic Changes

### Parimutuel (OLD)

```
Payout = (user_bet / winner_pool) × total_pool
- Users bet fixed amounts
- Payout depends on total pool size
- Odds set at creation
- No price discovery mechanism
```

### CPMM (NEW)

```
Price(option_i) = shares_i / total_shares
Cost = (new_shares / (total_shares_before + new_shares)) × collateral_balance
Payout(winner) = winning_shares × 0.1 AMAF tokens
- Dynamic pricing based on pool ratios
- Immediate price impact on trades
- Always liquid (virtual liquidity)
- Fixed payout per winning share
```

### Example Comparison

**Scenario**: Binary market, 100 total shares (50 YES, 50 NO)

| Action | Parimutuel | CPMM |
|---------|-------------|-------|
| Initial Price | Fixed by pool | 50¢ YES, 50¢ NO |
| Buy 10 YES | N/A | YES: 54.55¢, NO: 45.45¢ |
| Buy 10 NO | N/A | YES: 45.45¢, NO: 54.55¢ |
| YES Wins, 10 shares | Depends on pool | 1 AMAF token |

---

## New Error Codes

```rust
#[error_code]
pub enum CustomError {
    // Existing errors preserved
    MarketResolved,
    MarketNotResolved,
    AlreadyClaimed,
    NotWinner,
    ClaimTooSoon,
    QuestionTooLong,
    DescriptionTooLong,
    InvalidMint,
    InvalidOwner,
    
    // NEW CPMM errors
    InsufficientAmount,      // Trade amount too small
    InvalidOptionCount,     // Not 2-16 options
    InvalidOptionIndex,    // Option index out of range
    OptionNotActive,       // Trading disabled for option
    MaxOptionsReached,      // Cannot add 17th option
    OptionNameTooLong,     // Option name > 50 chars
    NoSharesInMarket,      // Cannot calculate refund
}
```

---

## Constants Changes

```rust
// ADDED
const MAX_OPTIONS: usize = 16;
const MAX_OPTION_NAME_LENGTH: usize = 50;

// PRESERVED
const MAX_QUESTION_LENGTH: usize = 200;  // Increased from 100
const MAX_DESCRIPTION_LENGTH: usize = 500;

// CPMM Constants
const VIRTUAL_LIQUIDITY: u64 = 50;   // L parameter
const PAYOUT_PER_SHARE: u128 = 10;    // 0.1 AMAF tokens per share
const COLLATERAL_DIVISOR: u128 = 10;  // Convert to AMAF tokens
```

---

## IDL Changes

### Instruction List

**OLD** (8 instructions)
- `initialize_mint`
- `create_market`
- `place_bet`
- `resolve_market`
- `cancel_market`
- `claim_payout`
- `claim_daily_amaf`

**NEW** (8 instructions)
- `initialize_mint` (preserved)
- `create_market` (updated - takes options array)
- `buy_shares` (renamed from `place_bet`)
- `add_option` (new)
- `resolve_market` (updated - takes winner_index)
- `cancel_market` (preserved)
- `claim_payout` (updated - CPMM logic)
- `claim_daily_amaf` (preserved)

### Account Types

**NEW Account Types**
```json
{
  "type": {
    "kind": "struct",
    "fields": [
      {
        "name": "marketType",
        "type": {
          "defined": "MarketType"
        }
      },
      {
        "name": "outcome",
        "type": {
          "defined": "Outcome"
        }
      },
      {
        "name": "options",
        "type": {
          "vec": [
            {
              "defined": "OptionData"
            }
          ]
        }
      }
    ]
  }
}
```

---

## Configuration Files

### Frontend

**`src/data/markets.ts`**
- Added: `MarketType` enum
- Added: `Outcome` enum
- Added: `OptionData` interface
- Updated: `Market` interface
- Added: `Bet` interface
- Updated: `getMarkets()` to handle new structure

**`src/lib/pricing.ts`** (NEW)
- Added: All CPMM pricing functions

### Smart Contract

**`programs/amafcoin/src/lib.rs`**
- Added: `MarketType` enum
- Added: `Outcome` enum
- Added: `OptionData` struct
- Updated: `Market` struct
- Updated: `Bet` struct
- Replaced: `place_bet` with `buy_shares`
- Added: `add_option` instruction
- Updated: `create_market` (takes options)
- Updated: `resolve_market` (takes winner_index)
- Updated: `claim_payout` (CPMM logic)
- Added: New error codes

---

## Testing

### Test Files Created

**Browser Smoke Tests** (`tests/BROWSER_SMOKE_TESTS.md`)
- 8 console-based validation tests
- Price calculation tests
- Payout formula tests
- PDA derivation tests

**Manual Testing Guide** (`tests/CPMM_TESTING_GUIDE.md`)
- 11 comprehensive test scenarios
- Step-by-step instructions
- Expected results
- Troubleshooting guide

### Test Scenarios

1. Binary market creation
2. Multi-option market creation (5 options)
3. Invalid option counts (1, 17)
4. Buy shares on binary market
5. Buy shares on multi-option market
6. Price impact verification
7. Add option to market
8. Resolve binary market
9. Resolve multi-option market
10. Cancel market
11. Claim payout (winner, loser, cancelled)
12. Claim daily AMAF tokens
13. 24-hour cooldown enforcement
14. Option name length enforcement
15. Max options enforcement
16. Invalid option index rejection
17. Market resolution after cancel

---

## Migration Guide

### For Existing Users

**Action Required**: None (Clean Slate)

Since this is a clean slate migration with no legacy markets:
- No existing bets to migrate
- No market data to convert
- Fresh start for all users

### For Developers

**Update Required**:
1. Update frontend `PROGRAM_ID` if program ID changes
2. Re-run `npm install` after any dependency changes
3. Clear browser cache after deployment
4. Refresh wallet connection

---

## Known Limitations

### Current Implementation

1. **No Sell Functionality**
   - Users cannot sell shares before resolution
   - Must hold until market resolves

2. **No Shorting**
   - Cannot bet against options
   - Can only buy shares for options

3. **Maximum Options**
   - Limited to 16 options per market
   - Cannot exceed due to account space

4. **Single Winner Resolution**
   - Only one option can win
   - No split outcomes or partial wins

### Future Enhancements

1. **Sell Shares**
   - Allow users to sell before resolution
   - Calculate sell price based on current pool ratios

2. **Multiple Winners**
   - Support for split outcomes
   - Proportional payouts for multiple winning options

3. **Limit Orders**
   - Add limit order functionality
   - Execute trades at target prices

4. **Liquidity Providers**
   - Allow users to provide liquidity
   - Earn fees on trading volume

5. **Market Categories**
   - Add categories for better organization
   - Filter markets by category

---

## Deployment Information

### Program Deployment

**Devnet** (Current)
- Program ID: `Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW`
- Network: https://api.devnet.solana.com
- Deployed: February 4, 2026
- IDL Size: 1645 bytes

**Mainnet** (Pending)
- Status: Not yet deployed
- Requirements:
  - All devnet tests passing
  - Security audit (recommended)
  - Sufficient SOL for deployment

---

## Rollback Plan

If critical issues are discovered, rollback plan:

### Option 1: Disable CPMM Features
- Hide multi-option market creation
- Hide add option functionality
- Use hardcoded binary logic

### Option 2: Deploy Parimutuel Version
- Deploy backup parimutuel binary
- Update frontend to use parimutuel API
- Clear CPMM state from accounts

### Option 3: Hotfix Updates
- Deploy program fixes via upgrade
- Update frontend without redeploying program
- Preserve existing market data

---

## References

### Documentation
- [README.md](./README.md) - Updated with CPMM information
- [CPMM Implementation Plan](./plans/cpmm-implementation-plan.md) - Original spec
- [Phase 4 Testing Complete](./tests/PHASE_4_TESTING_COMPLETE.md) - Testing documentation

### External References
- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf) - CPMM inspiration
- [Polymarket](https://polymarket.com/) - Industry reference
- [Kalshi](https://kalshi.com/) - Another prediction market reference
- [Anchor 0.32.0 Docs](https://www.anchor-lang.com/) - Smart contract framework

---

## Summary

### Completed Phases

✅ **Phase 1**: Smart Contract Changes
  - CPMM data structures
  - Updated instructions
  - New error codes

✅ **Phase 2**: Frontend Changes
  - TypeScript interfaces
  - Pricing utilities
  - UI components for binary and multi-option

✅ **Phase 3**: IDL & Deployment
  - Built Anchor program
  - Deployed to devnet
  - Upgraded IDL on-chain

✅ **Phase 4**: Testing Scenarios
  - Browser smoke tests
  - Manual testing guide
  - Comprehensive coverage

✅ **Phase 5**: Documentation
  - Updated README
  - Created changelog
  - API usage examples

### Key Metrics

| Metric | Before (Parimutuel) | After (CPMM) |
|--------|---------------------|----------------|
| Market Types | 1 (Binary only) | 2 (Binary + Multi-Option) |
| Options per Market | 2 (fixed) | 2-16 (dynamic) |
| Instructions | 8 | 8 |
| Account Types | 4 | 6 |
| Error Codes | 10 | 17 (+7 new) |
| Smart Contract Size | ~500 bytes | ~2600 bytes |
| Pricing Model | Parimutuel odds | CPMM formulas |
| Payout Model | Proportional | Fixed per share |

---

## Contact & Support

**Project Repository**: [GitHub URL]

**Issues**: Create GitHub issue with:
- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Browser/console errors

**Documentation Questions**: Check:
1. [README.md](./README.md) for general information
2. [tests/CPMM_TESTING_GUIDE.md](./tests/CPMM_TESTING_GUIDE.md) for testing
3. This changelog for detailed changes

---

**Last Updated**: February 4, 2026  
**Version**: CPMM Implementation v1.0
