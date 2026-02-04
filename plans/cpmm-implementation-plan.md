# CPMM Implementation Plan: Binary + Multi-Option Markets

## Overview

Transform from parimutuel pool betting to an **Automated Market Maker (AMM)** using **Constant Product Market Maker (CPMM)** for both binary and multi-option prediction markets.

**Clean Slate Change**: This is a complete migration with no legacy markets to preserve. All existing parimutuel markets will be replaced by CPMM markets.

### Design Specifications

**Market Types:**
1. **Binary Market**: 2 options (YES/NO)
2. **Multi-Option Market**: 2-16 custom options (dynamically addable)

**Shared Specifications:**
- **Price Precision**: 4 decimal places (stored as basis points: `10000000` = $1)
- **Share Denomination**: 1 share = 0.1 AMAF tokens at payout
- **Trading Fees**: 0%
- **Initial Virtual Liquidity**: 50 shares per option
- **Dynamic Options**: Can add options after creation (up to 16 max)
- **Resolution**: Single winning option only

### Key Changes from Parimutuel

| Aspect | Old (Parimutuel) | New (CPMM) |
|--------|------------------|------------|
| Pricing | No price, fixed bet amounts | Dynamic prices based on pool ratios |
| Entry | Bet fixed AMAF amount | Buy shares at current price |
| Payout | Proportional to pool share | Fixed $0.10 per winning share |
| Options | Binary only | Binary (2) or Multi (2-16) |
| Add Options | Not supported | Up to 16 options dynamically |

### Features to Preserve

The following existing features should be retained in the CPMM implementation:

1. **UserMarketsCounter** - Tracks number of markets per user for sequential indexing
2. **cancel_market** instruction - Allows market authorities to cancel unresolved markets
3. **claim_daily_amaf** instruction - Daily token claiming functionality
4. **DailyClaimState** struct - Tracks last claim timestamp per user

---

## Phase 1: Smart Contract Changes

### 1.1 Market Type Enum

**Add to top of `programs/amafcoin/src/lib.rs`:**

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MarketType {
    Binary,
    MultiOption,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Outcome {
    Unresolved,
    Cancelled,
    OptionWinner(u8), // Index of winning option (0-15)
}
```

### 1.2 Option Management Struct

**Add new struct:**

```rust
const MAX_OPTIONS: usize = 16;
const MAX_OPTION_NAME_LENGTH: usize = 50;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct OptionData {
    pub shares: u64,      // Shares issued for this option
    pub name: String,     // Option name (e.g., "Bitcoin", "Ethereum")
    pub active: bool,     // Whether option can be traded
}
```

### 1.3 Updated `Market` Struct

**Replace existing struct at `programs/amafcoin/src/lib.rs:176-186`:**

```rust
#[account]
pub struct Market {
    pub authority: Pubkey,
    pub market_index: u16,           // Preserved: Sequential market index for PDA
    pub bump: u8,
    pub market_type: MarketType,
    pub question: String,
    pub description: String,
    pub resolved: bool,
    pub outcome: Outcome,
    pub options: Vec<OptionData>,   // Array of options (2 for binary, 2-16 for multi)
    pub num_options: u8,             // Current number of active options (2-16)
    pub collateral_balance: u64,     // Total AMAF tokens in pool (6 decimals)
    pub virtual_liquidity: u64,      // Virtual liquidity parameter (L)
}

// Removed: total_yes, total_no, total_yes_shares, total_no_shares
// Added: options array, num_options, virtual_liquidity, market_type
// Preserved: market_index for PDA seeding consistency
```

### 1.4 Updated `Bet` Struct

**Replace existing struct at `programs/amafcoin/src/lib.rs:188-195`:**

```rust
#[account]
pub struct Bet {
    pub market: Pubkey,
    pub user: Pubkey,
    pub shares: u64,        // Number of shares owned
    pub option_index: u8,  // Index of option bet on (0 for YES, 1 for NO in binary)
    pub claimed: bool,
}

// Removed: side_yes, amount
// Added: option_index (replaces side_yes)
```

### 1.5 Update `create_market`

**Replace function at `programs/amafcoin/src/lib.rs:18-42`:**

```rust
pub fn create_market(
    ctx: Context<CreateMarket>,
    market_index: u16,
    question: String,
    description: String,
    options: Vec<String>,  // Option names (2 for binary, 2-16 for multi)
) -> Result<()> {
    require!(
        question.len() <= MAX_QUESTION_LENGTH,
        CustomError::QuestionTooLong
    );
    require!(
        description.len() <= MAX_DESCRIPTION_LENGTH,
        CustomError::DescriptionTooLong
    );

    let num_options = options.len() as u8;
    require!(
        num_options >= 2 && num_options <= 16,
        CustomError::InvalidOptionCount
    );

    let market_type = if num_options == 2 {
        MarketType::Binary
    } else {
        MarketType::MultiOption
    };

    let market = &mut ctx.accounts.market;
    market.authority = ctx.accounts.authority.key();
    market.market_index = market_index;  // Preserved: Store market index
    market.bump = ctx.bumps.market;
    market.market_type = market_type;
    market.question = question;
    market.description = description;
    market.resolved = false;
    market.outcome = Outcome::Unresolved;
    market.num_options = num_options;
    market.collateral_balance = 0;
    market.virtual_liquidity = 50; // L = 50

    // Initialize options with 50 shares each
    market.options = options
        .iter()
        .map(|name| OptionData {
            shares: 50,
            name: name.clone(),
            active: true,
        })
        .collect();

    // Initialize or update the user markets counter (Preserved)
    let counter = &mut ctx.accounts.user_markets_counter;
    if counter.authority == Pubkey::default() {
        // First time initialization
        counter.authority = ctx.accounts.authority.key();
        counter.count = 1;
    } else {
        // Increment existing counter
        counter.count += 1;
    }

    Ok(())
}
```

### 1.6 Update `buy_shares` (Generalized CPMM)

**Replace `place_bet` function with generalized CPMM version:**

```rust
pub fn buy_shares(
    ctx: Context<BuyShares>,
    shares: u64,
    option_index: u8,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(!market.resolved, CustomError::MarketResolved);
    require!(
        option_index < market.num_options,
        CustomError::InvalidOptionIndex
    );
    require!(
        market.options[option_index as usize].active,
        CustomError::OptionNotActive
    );

    let new_shares = shares as u128;
    let option_idx = option_index as usize;

    // Calculate total shares before purchase
    let total_shares_before: u128 = market.options
        .iter()
        .map(|opt| opt.shares as u128)
        .sum();

    // Cost calculation using generalized CPMM
    // Cost = collateral * (new_shares / (total_shares_before + new_shares))
    let collateral_needed = if total_shares_before == 0 {
        // Edge case: no shares yet, price shares based on L
        new_shares * market.virtual_liquidity as u128
    } else {
        let total_after = total_shares_before + new_shares;
        let ratio = (market.collateral_balance as u128) * new_shares;
        ratio / total_after
    };

    let tokens_needed = (collateral_needed / 10) as u64; // Convert to AMAF tokens
    require!(tokens_needed > 0, CustomError::InsufficientAmount);

    // Update option's share count
    market.options[option_idx].shares = (market.options[option_idx].shares as u128 + new_shares) as u64;

    // Update collateral
    market.collateral_balance += tokens_needed;

    // Create/update bet record
    let bet = &mut ctx.accounts.bet;
    bet.market = market.key();
    bet.user = ctx.accounts.user.key();
    bet.shares = shares;
    bet.option_index = option_index;
    bet.claimed = false;

    // Transfer tokens from user to escrow
    token::transfer(ctx.accounts.transfer_to_escrow(), tokens_needed)?;

    Ok(())
}
```

### 1.7 Add `add_option` Instruction

**New instruction for dynamically adding options:**

```rust
pub fn add_option(
    ctx: Context<AddOption>,
    option_name: String,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(!market.resolved, CustomError::MarketResolved);
    require!(
        market.num_options < MAX_OPTIONS as u8,
        CustomError::MaxOptionsReached
    );
    require!(
        option_name.len() <= MAX_OPTION_NAME_LENGTH,
        CustomError::OptionNameTooLong
    );

    // Add new option with 50 initial shares
    market.options.push(OptionData {
        shares: 50,
        name: option_name,
        active: true,
    });
    market.num_options += 1;

    Ok(())
}

#[derive(Accounts)]
pub struct AddOption<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
```

### 1.8 Preserve `cancel_market` Instruction

**The existing `cancel_market` instruction should be preserved:**

```rust
pub fn cancel_market(ctx: Context<ResolveMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(!market.resolved, CustomError::MarketResolved);

    market.resolved = true;
    market.outcome = Outcome::Cancelled;
    Ok(())
}
```

### 1.9 Update `resolve_market` for Multi-Option

**Replace function at `programs/amafcoin/src/lib.rs:66-73`:**

```rust
pub fn resolve_market(
    ctx: Context<ResolveMarket>,
    winner_index: u8,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(!market.resolved, CustomError::MarketResolved);
    require!(
        winner_index < market.num_options,
        CustomError::InvalidOptionIndex
    );

    market.resolved = true;
    market.outcome = Outcome::OptionWinner(winner_index);
    Ok(())
}
```

### 1.10 Update `claim_payout`

**Replace function at `programs/amafcoin/src/lib.rs:84-107`:**

```rust
pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
    let market = &ctx.accounts.market;
    let bet = &mut ctx.accounts.bet;

    require!(market.resolved, CustomError::MarketNotResolved);
    require!(!bet.claimed, CustomError::AlreadyClaimed);

    let payout = match market.outcome {
        Outcome::Cancelled => {
            // Refund: proportional to shares owned / total shares
            let total_shares: u128 = market.options
                .iter()
                .map(|opt| opt.shares as u128)
                .sum();
            if total_shares == 0 {
                return err!(CustomError::NoSharesInMarket);
            }
            let ratio = (bet.shares as u128) * (market.collateral_balance as u128);
            ratio / total_shares
        }
        Outcome::OptionWinner(winner_idx) => {
            if bet.option_index != winner_idx {
                return err!(CustomError::NotWinner);
            }
            // Winning shares: pay $0.10 per share
            (bet.shares as u128) / 10
        }
        _ => return err!(CustomError::MarketNotResolved),
    } as u64;

    bet.claimed = true;

    // Transfer from escrow to user (same CPI logic as before)
    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_token.to_account_info(),
        to: ctx.accounts.user_token.to_account_info(),
        authority: ctx.accounts.market.to_account_info(),
    };

    let bump = ctx.bumps.market;
    let seeds = &[
        &b"market"[..],
        ctx.accounts.market.authority.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    token::transfer(cpi_ctx, payout)?;

    Ok(())
}
```

### 1.11 Update Account Structs

**Update `CreateMarket` at `programs/amafcoin/src/lib.rs:231-248`:**

```rust
#[derive(Accounts)]
#[instruction(market_index: u16)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 1 + 1 + 1 + 4 + MAX_QUESTION_LENGTH + 4 + MAX_DESCRIPTION_LENGTH
               + 1 + 1 + 1 + 8 + 8 + (MAX_OPTIONS * (8 + 4 + MAX_OPTION_NAME_LENGTH + 1)),
        seeds = [&b"market"[..], authority.key().as_ref(), &market_index.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + 2,
        seeds = [&b"user_markets"[..], authority.key().as_ref()],
        bump
    )]
    pub user_markets_counter: Account<'info, UserMarketsCounter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}
```

**Preserve `UserMarketsCounter` struct at `programs/amafcoin/src/lib.rs:221-224`:**

```rust
#[account]
pub struct UserMarketsCounter {
    pub authority: Pubkey,
    pub count: u16,
}
```

**Replace `PlaceBet` with `BuyShares` at `programs/amafcoin/src/lib.rs:250-286`:**

```rust
#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = user,
        space = 8 + 64, // market(32) + user(32) + shares(8) + option_index(1) + claimed(1) + padding
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        constraint = user_token.mint == mint.key() @ CustomError::InvalidMint,
        constraint = user_token.owner == user.key() @ CustomError::InvalidOwner
    )]
    pub user_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = escrow_token.mint == mint.key() @ CustomError::InvalidMint,
        constraint = escrow_token.owner == market.key() @ CustomError::InvalidOwner
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
```

### 1.11 Update Helper Methods

**Replace `PlaceBet` impl with `BuyShares` at `programs/amafcoin/src/lib.rs:373-383`:**

```rust
impl<'info> BuyShares<'info> {
    pub fn transfer_to_escrow(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_token.to_account_info(),
            to: self.escrow_token.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
```

### 1.13 Add New Error Codes

**Add to `CustomError` enum at `programs/amafcoin/src/lib.rs:409-429`:**

```rust
#[error_code]
pub enum CustomError {
    #[msg("Market already resolved")]
    MarketResolved,
    #[msg("Market not resolved")]
    MarketNotResolved,
    #[msg("Bet already claimed")]
    AlreadyClaimed,
    #[msg("Not a winning bet")]
    NotWinner,
    #[msg("You have already claimed AMAF tokens within the last 24 hours. Please wait before claiming again.")]
    ClaimTooSoon,
    #[msg("Question too long")]
    QuestionTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid owner")]
    InvalidOwner,
    // New errors for CPMM
    #[msg("Insufficient amount for trade")]
    InsufficientAmount,
    #[msg("Invalid option count (must be 2-16)")]
    InvalidOptionCount,
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("Option is not active")]
    OptionNotActive,
    #[msg("Maximum options reached (16)")]
    MaxOptionsReached,
    #[msg("Option name too long")]
    OptionNameTooLong,
    #[msg("No shares in market")]
    NoSharesInMarket,
}
```

---

## Phase 2: Frontend Changes

### 2.1 Update TypeScript Interfaces

**File**: `src/data/markets.ts`

```typescript
export enum MarketType {
  Binary = 'Binary',
  MultiOption = 'MultiOption',
}

export enum Outcome {
  Unresolved = 'Unresolved',
  Cancelled = 'Cancelled',
  OptionWinner = 'OptionWinner', // with winner index
}

export interface OptionData {
  shares: bigint
  name: string
  active: boolean
}

export interface Market {
  publicKey: PublicKey
  authority: PublicKey
  marketIndex: number  // Preserved: Sequential market index
  bump: number
  marketType: MarketType
  question: string
  description: string
  resolved: boolean
  outcome: Outcome
  options: OptionData[]
  numOptions: number
  collateralBalance: bigint
  virtualLiquidity: bigint
}

export interface Bet {
  market: PublicKey
  user: PublicKey
  shares: bigint
  optionIndex: number
  claimed: boolean
}

// Preserve existing getMarketPDA with market_index
export function getMarketPDA(
  authority: PublicKey,
  marketIndex: number,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market'), authority.toBuffer(), Buffer.from(new Uint16Array([marketIndex]).buffer)],
    programId
  )
}
```

### 2.2 Create Pricing Utilities

**New file**: `src/lib/pricing.ts`

```typescript
const BASIS_POINTS = 10000000n
const VIRTUAL_LIQUIDITY = 50n

export function getOptionPrices(options: OptionData[]): number[] {
  const totalShares = options.reduce((sum, opt) => sum + opt.shares, 0n)

  if (totalShares === 0n) {
    // Equal probability for all options
    const numOptions = options.length
    return options.map(() => 1 / numOptions)
  }

  // Generalized CPMM: Price of option i = shares_i / total_shares
  return options.map(opt => {
    const price = (opt.shares * BASIS_POINTS) / totalShares
    return Number(price) / Number(BASIS_POINTS)
  })
}

export function calculateBuyCost(
  shares: bigint,
  options: OptionData[],
  collateralBalance: bigint,
  targetIndex: number
): { costTokens: bigint; newOptions: OptionData[] } {
  const newShares = shares
  const totalBefore = options.reduce((sum, opt) => sum + opt.shares, 0n)

  let collateralNeeded: bigint
  if (totalBefore === 0n) {
    // Edge case: no shares yet, price shares based on L
    collateralNeeded = newShares * VIRTUAL_LIQUIDITY
  } else {
    // Cost calculation using generalized CPMM
    const totalAfter = totalBefore + newShares
    const ratio = collateralBalance * newShares
    collateralNeeded = ratio / totalAfter
  }

  const newOptions = options.map((opt, idx) =>
    idx === targetIndex
      ? { ...opt, shares: opt.shares + newShares }
      : opt
  )

  return {
    costTokens: collateralNeeded / 10n, // Convert to AMAF tokens
    newOptions
  }
}

export function calculatePotentialPayout(shares: bigint): number {
  return Number(shares) / 10
}

export function formatPrice(price: number): string {
  return `$${(price * 100).toFixed(2)}¢`
}
```

### 2.3 Update Create Market Page

**File**: `src/routes/markets/create.tsx`

**Add market type selector and dynamic options:**

```typescript
const [marketType, setMarketType] = useState<'binary' | 'multi'>('binary')
const [options, setOptions] = useState<string[]>(['YES', 'NO'])
const [newOption, setNewOption] = useState('')

// Add option handler (for multi-option markets)
const handleAddOption = () => {
  if (newOption.trim() && options.length < 16) {
    setOptions([...options, newOption.trim()])
    setNewOption('')
  }
}

const handleRemoveOption = (index: number) => {
  if (options.length > 2) {
    setOptions(options.filter((_, i) => i !== index))
  }
}
```

**Update form UI to show option inputs:**

```typescript
{marketType === 'binary' ? (
  <div className="form-group">
    <label>Options (Fixed)</label>
    <div className="binary-options">
      <div className="option">YES</div>
      <div className="option">NO</div>
    </div>
  </div>
) : (
  <div className="form-group">
    <label>Options (2-16)</label>
    <div className="multi-options">
      {options.map((opt, idx) => (
        <div key={idx} className="option-row">
          <span>{idx + 1}. {opt}</span>
          {options.length > 2 && (
            <button type="button" onClick={() => handleRemoveOption(idx)}>
              Remove
            </button>
          )}
        </div>
      ))}
      {options.length < 16 && (
        <div className="add-option">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Option name"
          />
          <button type="button" onClick={handleAddOption}>
            Add Option
          </button>
        </div>
      )}
    </div>
  </div>
)}
```

**Update transaction call to pass options array and include market_index:**

```typescript
const userMarketsCounterPda = getMarketPDA(publicKey, 0) // First market gets index 0

// Get current count from UserMarketsCounter to determine next market_index
const currentCount = await program.account.userMarketsCounter.fetch(userMarketsCounterPda)
const marketIndex = currentCount.count

const [marketPda] = getMarketPDA(publicKey, marketIndex)

const tx = await program.methods
  .createMarket(marketIndex, question, description, options)
  .accounts({
    market: marketPda,
    userMarketsCounter: userMarketsCounterPda,
    authority: publicKey,
    mint: mintAddress,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### 2.4 Update Market Detail Page

**File**: `src/routes/markets/$id.tsx`

**Add option selection state:**

```typescript
import { getOptionPrices, calculateBuyCost, calculatePotentialPayout, formatPrice } from '@/lib/pricing'

const [selectedOption, setSelectedOption] = useState<number>(0)
const optionPrices = market ? getOptionPrices(market.options) : []
```

**Update UI to display all options with prices:**

```typescript
<div className="options-grid">
  {market.options.map((option, idx) => (
    <div
      key={idx}
      className={`option-card ${selectedOption === idx ? 'selected' : ''}`}
      onClick={() => setSelectedOption(idx)}
    >
      <h3>{option.name}</h3>
      <div className="option-price">
        {formatPrice(optionPrices[idx])}
      </div>
      <div className="option-shares">
        {formatNumber(option.shares)} shares
      </div>
      {!option.active && <span className="inactive-badge">Inactive</span>}
    </div>
  ))}
</div>
```

**Update buy function to use selected option:**

```typescript
const costPreview = shares > 0n && market
  ? calculateBuyCost(shares, market.options, market.collateralBalance, selectedOption)
  : null

const tx = await program.methods
  .buyShares(shares, selectedOption)
  .accounts({
    market: marketPublicKey,
    bet: betPda,
    userToken: userTokenResult.address,
    escrowToken: escrowTokenAddress,
    user: publicKey,
    mint: mintAddress,
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

**Add cancel market button (Market Authority Only):**

```typescript
{market.authority.equals(publicKey!) && !market.resolved && (
  <button onClick={handleCancelMarket}>
    Cancel Market
  </button>
)}

// Handler:
async function handleCancelMarket() {
  const program = await getProgram(connection, {
    publicKey,
    signTransaction,
    signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
  })

  await program.methods
    .cancelMarket()
    .accounts({
      market: new PublicKey(id),
      authority: publicKey,
    })
    .rpc()

  // Refresh market data
}
```

**Update resolution UI for multi-option markets:**

```typescript
{market.marketType === MarketType.Binary ? (
  <div className="resolve-buttons">
    <button onClick={() => handleResolveMarket(0)}>
      YES Wins
    </button>
    <button onClick={() => handleResolveMarket(1)}>
      NO Wins
    </button>
  </div>
) : (
  <div className="resolve-buttons">
    <label>Select Winner:</label>
    <select
      value={winnerIndex}
      onChange={(e) => setWinnerIndex(parseInt(e.target.value))}
    >
      {market.options.map((opt, idx) => (
        <option key={idx} value={idx}>
          {opt.name}
        </option>
      ))}
    </select>
    <button onClick={() => handleResolveMarket(winnerIndex)}>
      Resolve Market
    </button>
  </div>
)}
```

**Add "Add Option" button (Market Creator Only):**

```typescript
{market.authority.equals(publicKey!) && !market.resolved && market.marketType === MarketType.MultiOption && market.numOptions < 16 && (
  <div className="add-option-section">
    <h3>Add Option</h3>
    <form onSubmit={handleAddOption}>
      <input
        type="text"
        value={newOptionName}
        onChange={(e) => setNewOptionName(e.target.value)}
        placeholder="Option name"
        maxLength={50}
      />
      <button type="submit">Add</button>
    </form>
  </div>
)}

// Handler:
async function handleAddOption(e: React.FormEvent) {
  e.preventDefault()
  if (!newOptionName.trim()) return

  const program = await getProgram(connection, {
    publicKey,
    signTransaction,
    signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
  })

  await program.methods
    .addOption(newOptionName)
    .accounts({
      market: new PublicKey(id),
      authority: publicKey,
    })
    .rpc()

  setNewOptionName('')
  // Refresh market data
}
```

### 2.5 Update Market Listing Page

**File**: `src/routes/markets/index.tsx`

**Show market type and summary:**

```typescript
import { getOptionPrices, formatPrice } from '@/lib/pricing'

<div className="market-card">
  <div className="market-header">
    <span className={`market-type ${market.marketType === MarketType.Binary ? 'binary' : 'multi'}`}>
      {market.marketType === MarketType.Binary ? 'Binary' : `${market.numOptions} Options`}
    </span>
    <span className={`status-badge ${market.resolved ? 'status-resolved' : 'status-active'}`}>
      {market.resolved ? 'Resolved' : 'Active'}
    </span>
  </div>
  <h3>{market.question}</h3>
  <p>{market.description}</p>
  <div className="options-preview">
    {market.marketType === MarketType.Binary ? (
      <div className="binary-preview">
        <span>YES: {formatPrice(optionPrices[0])}</span>
        <span>NO: {formatPrice(optionPrices[1])}</span>
      </div>
    ) : (
      <div className="multi-preview">
        {market.options.slice(0, 3).map((opt, idx) => (
          <span key={idx}>{opt.name}: {formatPrice(optionPrices[idx])}</span>
        ))}
        {market.numOptions > 3 && <span>+{market.numOptions - 3} more</span>}
      </div>
    )}
  </div>
</div>
```

---

## Phase 3: IDL Regeneration & Deployment

### 3.1 Build Anchor Program

```bash
# Build in Docker container
docker compose run --rm anchor anchor build

# Copy new IDL to frontend
cp target/idl/amafcoin.json src/lib/idl/

# Verify IDL contains new instructions
cat src/lib/idl/amafcoin.json | jq '.instructions[].name'

# Expected instructions:
# - cancel_market (preserved)
# - claim_daily_amaf (preserved)
# - claim_payout (updated for CPMM)
# - create_market (updated with options array)
# - initialize_mint (preserved)
# - add_option (new)
# - place_bet -> buy_shares (renamed/updated)
# - resolve_market (updated for multi-option)
```

### 3.1 Build Anchor Program

```bash
# Build in Docker container
docker compose run --rm anchor anchor build

# Copy new IDL to frontend
cp target/idl/amafcoin.json src/lib/idl/

# Verify IDL contains new instructions
cat src/lib/idl/amafcoin.json | jq '.instructions[].name'
```

### 3.2 Deploy to Devnet (if testing)

```bash
# Deploy program
docker compose run --rm anchor anchor deploy

# Note program ID (may change if not pre-deployed)
```

---

## Phase 4: Testing Scenarios

### Test 1: Binary Market Creation
- Create binary market with "YES", "NO" options
- Verify initial state: 2 options, each with 50 shares
- Verify market type is `Binary`
- Verify initial prices: YES = 50¢, NO = 50¢
- Verify `UserMarketsCounter` increments

### Test 2: Multi-Option Market Creation
- Create multi-option market with 5 custom options
- Verify initial state: 5 options, each with 50 shares
- Verify market type is `MultiOption`
- Verify equal initial prices (20% each)
- Verify market_index increments from previous market

### Test 3: Buy Binary Market Shares
- Buy 10 YES shares
- Verify collateral transfer from user
- Verify YES pool increases to 60 shares
- Verify new price moves (YES price decreases, NO price increases)
- Verify cost calculation with collateral_balance

### Test 4: Buy Multi-Option Shares
- Buy shares for option 2
- Verify price impact on all options
- Verify proportional price shifts
- Verify bet record with option_index

### Test 5: Add Option Dynamically
- As market creator, add new option
- Verify new option has 50 shares
- Verify option count increments
- Verify prices adjust (dilutes existing options)

### Test 6: Claim Payout (Winner - Binary)
- Resolve binary market: YES wins
- Claim as YES holder
- Verify payout = shares * 0.1 AMAF tokens
- Verify claim flag set

### Test 7: Claim Payout (Loser - Binary)
- Resolve binary market: YES wins
- Attempt to claim as NO holder
- Verify error: `NotWinner`

### Test 8: Claim Payout (Winner - Multi)
- Resolve multi-option market: option 2 wins
- Claim as option 2 holder
- Verify payout = shares * 0.1 AMAF tokens

### Test 9: Cancel Market (Preserved Feature)
- Cancel unresolved market
- All bettors should get proportional refunds
- Verify refund calculations using cancelled outcome

### Test 10: Claim Daily AMAF (Preserved Feature)
- Claim daily tokens
- Verify 24-hour cooldown
- Verify 100,000,000,000 (100 tokens) minted
- Verify `DailyClaimState` updates correctly

### Test 11: Edge Cases
- Buy when total_shares = 0
- Buy maximum shares (u64)
- Add 16th option
- Resolve invalid option index
- Attempt to add option after max (16) reached
- Attempt to cancel already resolved market

---

## Phase 5: Implementation Order

1. **Smart Contract - Core Structures**
    - Add MarketType, Outcome, OptionData enums/structs
    - Update Market struct (preserve market_index)
    - Update Bet struct (replace side_yes with option_index)
    - Preserve UserMarketsCounter and DailyClaimState structs
    - Update CreateMarket instruction (preserve UserMarketsCounter)

2. **Smart Contract - Trading Logic**
    - Replace `place_bet` with `buy_shares` (generalized CPMM)
    - Add `add_option` instruction
    - Update `claim_payout` for multi-option
    - Preserve `cancel_market` instruction (update for Outcome enum)
    - Preserve `claim_daily_amaf` instruction

3. **Smart Contract - Resolution**
    - Update `resolve_market` for option index
    - Add new error codes
    - Update account validations for new structs

4. **Build & IDL Generation**
    - Build Anchor program
    - Generate new IDL
    - Copy to frontend
    - Verify all preserved and new instructions present

5. **Frontend - Utilities**
    - Create `src/lib/pricing.ts` with generalized formulas
    - Update TypeScript interfaces in `src/data/markets.ts`
    - Preserve `getMarketPDA` with market_index
    - Add PDA helper for UserMarketsCounter if needed

6. **Frontend - Create Market**
    - Add market type selector
    - Add dynamic options UI (2-16 options)
    - Update transaction call to include options array
    - Handle UserMarketsCounter for market_index

7. **Frontend - Market Detail**
    - Display all options with prices
    - Add option selection for buying
    - Update buy logic for CPMM pricing
    - Add option addition UI (market authority only)
    - Add cancel market button (market authority only)

8. **Frontend - Market Listing**
    - Show market type (Binary/Multi-Option)
    - Display option summary with prices
    - Filter by market type

9. **Frontend - Daily Claim (Preserved)**
    - Preserve existing daily claim functionality
    - Update interface if needed for new IDL

10. **Testing**
    - Binary market creation and trading
    - Multi-option market creation (3+ options)
    - Adding options dynamically
    - CPMM pricing verification
    - Payout verification (winner, loser, cancelled)
    - Daily AMAF claiming
    - Market cancellation
    - Edge case testing

11. **Documentation**
     - Update README with CPMM explanation
     - Document API changes
     - Add examples for both market types
     - Document preserved features (cancel_market, claim_daily_amaf)

12. **Deployment**
     - Deploy updated program to devnet
     - Verify all functionality works on devnet
     - Update frontend program ID if needed

---

## Key Differences Summary

| Aspect | Binary Market | Multi-Option Market |
|--------|---------------|---------------------|
| Options | 2 (YES/NO) | 2-16 (custom names) |
| Storage | Fixed 2-option display | Options array (max 16) |
| Bet Tracking | `option_index: 0/1` | `option_index: 0-15` |
| Resolution | `winner_index: 0/1` | `winner_index: 0-15` |
| Add Options | Not allowed | Up to 16, dynamic |
| CPMM Formula | YES: YES_shares / total | Price_i: shares_i / total |
| Initial Price | YES = 50¢, NO = 50¢ | All options = 1/n (n = num_options) |

### Preserved Features from Parimutuel Implementation

| Feature | Status | Notes |
|---------|--------|-------|
| `market_index` | Preserved | Used for PDA seeding, sequential per user |
| `UserMarketsCounter` | Preserved | Tracks market count per user |
| `cancel_market` | Preserved | Updated to use `Outcome::Cancelled` |
| `claim_daily_amaf` | Preserved | No changes needed |
| `DailyClaimState` | Preserved | No changes needed |
| Market PDA seeds | Preserved | `[b"market", authority, market_index]` |

---

## References

- **Polymarket**: Uses CLOB order book, but shares pay $1
- **Kalshi**: Uses parimutuel-style with implied odds
- **CPMM**: x * y = k (Uniswap v2 formula, extended to n options)
- **Anchor 0.32.0**: Smart contract framework used for Solana programs
- **Solana PDAs**: Program Derived Addresses for deterministic account generation

---

## Clean Slate Migration Strategy

### No Legacy Markets
This is a complete replacement of the parimutuel system with CPMM. There are **no legacy markets to migrate** because:
1. The system is still in development
2. No production markets exist on mainnet
3. All testnet/devnet data can be discarded

### Breaking Changes
The following are breaking changes that require a fresh deployment:
- **Market struct**: Completely restructured with CPMM fields
- **Bet struct**: Replaced `side_yes` with `option_index`
- **Instructions**: `place_bet` → `buy_shares`, `resolve_market` signature changed
- **Pricing**: From fixed parimutuel to dynamic CPMM pricing

### Deployment Strategy
1. **Devnet Deployment**: Deploy updated program to devnet
2. **Testing**: Full testing suite on devnet
3. **Mainnet Deployment**: Deploy to mainnet once devnet testing is complete
4. **Program ID**: New program ID will be used (or update existing if pre-deployed)

---

## Notes

- **No fees**: Unlike Polymarket (2-4%), this implementation has 0% fees
- **No early selling**: Users must hold until resolution (simpler than allowing sell orders)
- **Virtual liquidity**: 50 shares per option provides initial price stability
- **Single winner**: Only one option can win (no split outcomes)
- **Shared collateral**: All options share the same collateral pool

---

## Plan Update Summary

### Changes Made to Accommodate Current Codebase

1. **Added Clean Slate Migration Section**
   - Clarified no legacy markets need migration
   - Documented breaking changes
   - Outlined deployment strategy

2. **Added Features to Preserve Section**
   - Documented `UserMarketsCounter` preservation
   - Documented `cancel_market` instruction preservation
   - Documented `claim_daily_amaf` instruction preservation
   - Documented `DailyClaimState` struct preservation

3. **Updated Market Struct**
   - Preserved `market_index` field
   - Added note about PDA seeding compatibility

4. **Updated create_market Function**
   - Preserved `UserMarketsCounter` initialization logic
   - Added `market_index` parameter handling
   - Updated space calculation

5. **Added cancel_market Section**
   - Documented existing instruction preservation
   - Updated to use `Outcome::Cancelled`

6. **Updated Account Structs**
   - Added `UserMarketsCounter` account to CreateMarket
   - Preserved existing PDA seeding scheme
   - Updated space calculation for Vec<OptionData>

7. **Updated TypeScript Interfaces**
   - Preserved `marketIndex` in Market interface
   - Updated `getMarketPDA` to keep `marketIndex` parameter
   - Added note about backward compatibility

8. **Updated Frontend Examples**
   - Added `UserMarketsCounter` PDA usage
   - Added `marketIndex` handling in transactions
   - Added cancel market button example
   - Fixed `calculateBuyCost` to include `collateralBalance`

9. **Updated Testing Scenarios**
   - Added tests for preserved features
   - Added UserMarketsCounter verification
   - Added daily claim test
   - Added additional edge case tests

10. **Updated Implementation Order**
    - Added preserved features to implementation steps
    - Added deployment phase
    - Added documentation updates

11. **Updated Key Differences Summary**
    - Added preservation comparison table
    - Documented what's preserved vs. what's changed

12. **Updated Notes**
    - Added clean slate note
    - Added preserved features note
    - Added PDA consistency note

### Key Decisions Made

- **PDA Seeding**: Kept `[b"market", authority, market_index]` for consistency
- **Market Indexing**: Preserved sequential indexing via `UserMarketsCounter`
- **Feature Preservation**: Maintained all existing non-market-related features
- **Clean Deployment**: No migration logic needed for legacy data
- **Clean slate**: No legacy market migration required
- **Preserved features**: UserMarketsCounter, cancel_market, claim_daily_amaf maintained
- **PDA consistency**: Market PDAs retain `[b"market", authority, market_index]` seeds for compatibility
