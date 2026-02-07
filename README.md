# AMAF.FUN - CPMM Prediction Markets

A Solana-based prediction market web application powered by **Constant Product Market Maker (CPMM)** for both binary and multi-option prediction markets using AMAF tokens.

## What is CPMM?

**Constant Product Market Maker (CPMM)** is an automated market maker protocol that provides continuous liquidity for prediction markets. Unlike traditional parimutuel pools, CPMM allows users to:

- **Buy shares at dynamic prices** based on real-time supply/demand
- **Trade anytime** without waiting for a market to fill
- **See immediate price impact** when making trades
- **Earn proportional rewards** when correct

### Key Differences: Parimutuel vs CPMM

| Aspect | Parimutuel | CPMM |
|---------|-------------|-------|
| Pricing | Fixed odds set at creation | Dynamic prices based on pool ratios |
| Trading | Bet fixed amounts | Buy any number of shares |
| Liquidity | Pool must fill before trading | Always liquid (virtual liquidity) |
| Payout | Proportional to pool share | Fixed per winning share ($0.10) |
| Entry | Bet against pool | Buy shares at current price |

## Market Types

### Binary Markets
- **2 Options**: YES and NO
- **Use Case**: Yes/No questions (e.g., "Will Bitcoin reach $100,000?")
- **Initial Pricing**: 50% YES, 50% NO
- **Resolution**: Single winner (YES or NO)

### Multi-Option Markets
- **2-16 Options**: Custom named options (e.g., "Bitcoin", "Ethereum", "Solana")
- **Use Case**: Questions with multiple possible outcomes
- **Initial Pricing**: Equal probability (1/n) for all options
- **Dynamic Options**: Can add new options up to 16 maximum
- **Resolution**: Single winning option

## Pricing Mechanics

### CPMM Formula

The price of each option is calculated as:

```
Price(option_i) = shares_i / total_shares
```

Where:
- `shares_i` = Total shares issued for option i
- `total_shares` = Sum of all shares across all options

### Buying Shares

When you buy shares, the cost is calculated as:

```
Cost = (new_shares / (total_shares_before + new_shares)) × collateral_pool
```

Then converted to AMAF tokens:
```
Tokens_Needed = Cost / 10
```

### Price Impact

Buying shares for an option:
- **Decreases** that option's price (more shares = lower price)
- **Increases** all other options' prices (dilution effect)

### Payouts

Winning shares pay a fixed amount:
```
Payout = winning_shares × 0.1 AMAF tokens
```

Cancelled markets refund proportionally:
```
Refund = (user_shares / total_shares) × collateral_balance
```

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **Solana CLI**: `solana-toolkit` installed
- **Wallet**: Phantom or other Solana wallet
- **Devnet SOL**: For testing transactions
- **AMAF Tokens**: Claim daily tokens for trading

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd amaf.fun

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3001`

## Building For Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Testing

This project includes comprehensive testing infrastructure:

### Browser Smoke Tests
Quick console-based validation tests with no transaction costs:
```bash
# Open browser console, navigate to a market, then run:
node tests/BROWSER_SMOKE_TESTS.md
```

See `tests/BROWSER_SMOKE_TESTS.md` for 8 calculation and data structure tests.

### Manual UI Tests
Comprehensive end-to-end testing of all CPMM features:
```bash
# Follow the guide:
cat tests/CPMM_TESTING_GUIDE.md
```

The guide includes 11 test scenarios:
- Binary and multi-option market creation
- Buying shares and price impact verification
- Adding options dynamically
- Resolution (binary and multi-option)
- Payout claims (winners, losers, cancelled)
- Daily AMAF claiming
- Edge cases and error handling

### Automated Tests (Optional)
For full integration testing once system is validated:
```bash
# Run Anchor tests (requires setup)
docker compose run --rm anchor anchor test
```

## Styling

This project uses **Tailwind CSS v4** for styling.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Key Routes

- `/markets` - List all prediction markets
- `/markets/create` - Create a new market (binary or multi-option)
- `/markets/$id` - View and trade on a specific market
- `/claim` - Claim daily AMAF tokens

## Smart Contract

### Program Details

- **Program ID**: `Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW`
- **Network**: Devnet (testing)
- **Framework**: Anchor 0.32.0
- **Language**: Rust

### Instructions

| Instruction | Description |
|-------------|-------------|
| `create_market` | Create a new prediction market |
| `buy_shares` | Buy shares for an option (CPMM pricing) |
| `add_option` | Add a new option to multi-option market |
| `resolve_market` | Resolve market with winning option |
| `cancel_market` | Cancel an unresolved market |
| `claim_payout` | Claim winnings or refund |
| `claim_daily_amaf` | Claim daily 100 AMAF tokens |
| `initialize_mint` | Initialize AMAF token mint |

### Data Structures

#### Market
```rust
pub struct Market {
    pub authority: Pubkey,           // Market creator
    pub market_index: u16,            // Sequential index for PDA
    pub market_type: MarketType,        // Binary or MultiOption
    pub question: String,               // Market question
    pub description: String,            // Market description
    pub resolved: bool,                // Whether resolved
    pub outcome: Outcome,               // Result (Cancelled or OptionWinner)
    pub options: Vec<OptionData>,      // Array of options (2-16)
    pub num_options: u8,               // Current option count
    pub collateral_balance: u64,       // Total AMAF in pool
    pub virtual_liquidity: u64,        // L parameter (50)
}
```

#### Option
```rust
pub struct OptionData {
    pub shares: u64,       // Shares issued
    pub name: String,      // Option name
    pub active: bool,       // Can be traded
}
```

#### Bet
```rust
pub struct Bet {
    pub market: Pubkey,       // Which market
    pub user: Pubkey,         // Which user
    pub shares: u64,          // How many shares
    pub option_index: u8,    // Which option (0-15)
    pub claimed: bool,         // Already claimed payout
}
```

## API Usage Examples

### Create Binary Market

```typescript
import { getProgram, getMarketPDA } from '@/data/markets'
import { getMintPDA, getUserMarketsCounterPDA } from '@/data/tokens'

const program = await getProgram(connection, wallet)

// Determine next market index
const counterPda = getUserMarketsCounterPDA(publicKey)
const counter = await program.account.userMarketsCounter.fetch(counterPda)
const marketIndex = counter.count

// Create market with YES/NO options
const [marketPda] = getMarketPDA(publicKey, marketIndex)
const [mintPda] = getMintPDA()

await program.methods
  .createMarket(
    marketIndex,
    "Will Bitcoin reach $100,000?",
    "Binary market for Bitcoin price prediction",
    ["YES", "NO"]  // Binary has fixed options
  )
  .accounts({
    market: marketPda,
    userMarketsCounter: counterPda,
    authority: publicKey,
    mint: mintPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### Create Multi-Option Market

```typescript
const options = [
  "Bitcoin",
  "Ethereum",
  "Solana",
  "Cardano",
  "Polkadot"
]

await program.methods
  .createMarket(
    marketIndex,
    "Which cryptocurrency will have highest market cap?",
    "Multi-option market for crypto market cap prediction",
    options  // Custom option names (2-16 allowed)
  )
  .accounts({
    market: marketPda,
    userMarketsCounter: counterPda,
    authority: publicKey,
    mint: mintPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### Buy Shares

```typescript
const shares = 10n  // Number of shares to buy
const optionIndex = 0  // Which option (0 = YES in binary)

const [betPda] = getBetPDA(marketPda, publicKey)
const [userTokenPda] = getOrCreateUserTokenAccount(publicKey, mintPda)
const [escrowTokenPda] = getEscrowTokenAccount(marketPda, mintPda)

await program.methods
  .buyShares(shares, optionIndex)
  .accounts({
    market: marketPda,
    bet: betPda,
    userToken: userTokenPda,
    escrowToken: escrowTokenPda,
    user: publicKey,
    mint: mintPda,
    tokenProgram: TokenProgram.programId,
    associatedTokenProgram: AssociatedTokenProgram.programId,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### Add Option to Market

```typescript
await program.methods
  .addOption("New Option Name")
  .accounts({
    market: marketPda,
    authority: publicKey,  // Must be market authority
  })
  .rpc()
```

### Resolve Market

```typescript
// Binary market
await program.methods
  .resolveMarket(0)  // 0 = YES wins, 1 = NO wins
  .accounts({
    market: marketPda,
    authority: publicKey,  // Must be market authority
  })
  .rpc()

// Multi-option market
await program.methods
  .resolveMarket(2)  // Index of winning option (0-15)
  .accounts({
    market: marketPda,
    authority: publicKey,
  })
  .rpc()
```

### Claim Payout

```typescript
await program.methods
  .claimPayout()
  .accounts({
    market: marketPda,
    bet: betPda,
    userToken: userTokenPda,
    escrowToken: escrowTokenPda,
    user: publicKey,
    mint: mintPda,
    tokenProgram: TokenProgram.programId,
    associatedTokenProgram: AssociatedTokenProgram.programId,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### Claim Daily AMAF

```typescript
// Claim 100 AMAF tokens (24-hour cooldown)
await program.methods
  .claimDaily()
  .accounts({
    mint: mintPda,
    programAuthority: programAuthorityPda,
    userToken: userTokenPda,
    claimState: claimStatePda,
    user: publicKey,
    tokenProgram: TokenProgram.programId,
    associatedTokenProgram: AssociatedTokenProgram.programId,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

## Preserved Features

The following features from the original parimutuel implementation are preserved:

### UserMarketsCounter
- **Purpose**: Tracks sequential market index per user
- **PDA Seeds**: `[b"user_markets", authority]`
- **Behavior**: Increments on each market creation
- **Use Case**: Enables deterministic PDAs for markets

### Cancel Market
- **Instruction**: `cancel_market`
- **Purpose**: Cancel unresolved markets
- **Behavior**:
  - Sets `resolved = true`
  - Sets `outcome = Cancelled`
  - Enables proportional refunds for all bettors
- **Authorization**: Market authority only

### Claim Daily AMAF
- **Instruction**: `claim_daily_amaf`
- **Purpose**: Daily token claiming
- **Behavior**:
  - Mints 100 AMAF tokens (100,000,000,000 raw)
  - Updates `DailyClaimState.last_claim` timestamp
  - Enforces 24-hour cooldown between claims
- **Use Case**: Free daily tokens for trading

### Market PDA Consistency
- **Seeds**: `[b"market", authority, market_index]`
- **Preserved**: Same PDA scheme as parimutuel
- **Compatibility**: Market index determines deterministic address

## Key Specifications

- **Price Precision**: 4 decimal places (basis points)
- **Share Denomination**: 1 share = 0.1 AMAF tokens at payout
- **Trading Fees**: 0%
- **Initial Virtual Liquidity**: 50 shares per option
- **Max Options**: 16 (dynamically addable)
- **Resolution**: Single winning option only
- **Minimum Options**: 2
- **Option Name Length**: Max 50 characters
- **Question Length**: Max 200 characters
- **Description Length**: Max 500 characters

## Deployment

### Current Deployment

- **Network**: Devnet
- **Program ID**: `Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW`
- **Status**: Testing phase complete, ready for mainnet deployment

### Deploy to Mainnet

```bash
# Set Solana config to mainnet
solana config set --url mainnet-beta

# Deploy program
docker compose run --rm anchor anchor deploy

# Note the new program ID
```

Update the frontend `PROGRAM_ID` in `src/data/markets.ts` after deployment.

## Tech Stack

- **Frontend**: React 19, TypeScript 5.7, TanStack Router/Start
- **Styling**: Tailwind CSS v4
- **Smart Contract**: Rust with Anchor 0.32.0
- **Blockchain**: Solana
- **Testing**: Vitest
- **Build Tool**: Vite

## Architecture

```
amaf.fun/
├── programs/
│   └── amafcoin/          # Anchor smart contract
│       ├── src/
│       │   └── lib.rs     # CPMM implementation
│       └── Anchor.toml       # Program configuration
├── src/
│   ├── components/          # React components
│   ├── data/              # API utilities and type definitions
│   │   ├── markets.ts     # Market data interfaces
│   │   └── tokens.ts      # Token utilities
│   ├── lib/               # Shared utilities
│   │   └── pricing.ts    # CPMM pricing calculations
│   ├── routes/            # File-based routes
│   │   ├── __root.tsx    # Root layout
│   │   ├── markets/       # Market pages
│   │   ├── claim.tsx      # Daily claim page
│   │   └── index.tsx      # Home page
│   └── router.tsx          # Router configuration
└── tests/                  # Testing documentation
    ├── BROWSER_SMOKE_TESTS.md
    ├── CPMM_TESTING_GUIDE.md
    └── PHASE_4_TESTING_COMPLETE.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test` and browser smoke tests
5. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions:
- Open an issue on GitHub
- Check `tests/CPMM_TESTING_GUIDE.md` for troubleshooting
- Review browser console for error messages

## Acknowledgments

- **Anchor Framework**: Solana smart contract development
- **TanStack**: Full-stack React framework
- **Solana Web3.js**: Solana JavaScript SDK
- **CPMM Concept**: Inspired by Uniswap's constant product formula
