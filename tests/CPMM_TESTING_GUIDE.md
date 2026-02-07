# CPMM Implementation Testing Guide

This guide provides step-by-step instructions for testing the CPMM implementation on devnet.

## Important Notes

**Testing Approach**: The CPMM implementation includes two testing approaches:

1. **Browser Smoke Tests** (`BROWSER_SMOKE_TESTS.md`)
   - Quick console-based validation tests
   - No transaction costs
   - Verifies calculations and data structures
   - Run these first before manual testing

2. **Manual UI Tests** (this guide)
   - Full end-to-end testing
   - Requires devnet SOL and AMAF tokens
   - Tests all user flows

**Testing Environment**:
- Use devnet for initial testing
- Use Phantom or similar Solana wallet
- Ensure you have devnet SOL for transaction fees
- Claim daily AMAF tokens for trading

## Prerequisites

1. **Wallet**: Connect a Solana wallet with devnet SOL
2. **Tokens**: Claim daily AMAF tokens for trading
3. **Access**: Navigate to http://localhost:3001/markets

## Test 1: Binary Market Creation

### Steps
1. Navigate to `/markets/create`
2. Select **Binary** market type
3. Enter question: `"Will Bitcoin reach $100,000 by end of 2024?"`
4. Enter description: `"Binary prediction market for Bitcoin price"`
5. Click **Create Market**

### Expected Results
- Market created with 2 options: YES and NO
- Market type displayed as "Binary"
- Each option initialized with 50 shares
- Initial prices: YES = 50¢, NO = 50¢
- UserMarketsCounter incremented by 1

### Verification
```javascript
// In browser console, check:
await window.solana.request({ method: 'getAccountInfo', params: [marketPda] })
// Verify options array has 2 entries with shares: 50 each
```

---

## Test 2: Multi-Option Market Creation

### Steps
1. Navigate to `/markets/create`
2. Select **Multi-Option** market type
3. Enter question: `"Which cryptocurrency will have highest market cap?"`
4. Enter description: `"Multi-option prediction market"`
5. Add 5 options:
   - Option 1: "Bitcoin"
   - Option 2: "Ethereum"
   - Option 3: "Solana"
   - Option 4: "Cardano"
   - Option 5: "Polkadot"
6. Click **Create Market**

### Expected Results
- Market created with 5 options
- Market type displayed as "5 Options"
- Each option initialized with 50 shares
- Initial prices: Each option = 20¢ (1/5)
- UserMarketsCounter incremented

### Verification
- Check that each option shows "50 shares"
- Verify all 5 options have equal prices
- Confirm market_index increased from previous market

---

## Test 3: Buy Binary Market Shares

### Steps
1. Navigate to any binary market
2. Select **YES** option
3. Enter shares: `10`
4. Click **Buy Shares**

### Expected Results
- Transaction succeeds
- YES pool increases to 60 shares (50 + 10)
- NO pool remains at 50 shares
- Price shifts: YES decreases, NO increases
- Bet record created with 10 shares and option_index = 0
- User's token balance decreases by cost

### Price Impact Verification
- Initial: YES = 50%, NO = 50%
- After 10 YES shares: YES = 60/110 = 54.55%, NO = 45.45%
- Expected price shift visible in UI

---

## Test 4: Buy Multi-Option Shares

### Steps
1. Navigate to a multi-option market (5+ options)
2. Select option 2 (e.g., "Solana")
3. Enter shares: `20`
4. Click **Buy Shares**

### Expected Results
- Transaction succeeds
- Selected option increases to 70 shares (50 + 20)
- Other options remain at 50 shares
- All prices adjust proportionally
- Bet record created with 20 shares and option_index = 2

### Price Impact
- All options' prices should change
- Selected option's price decreases
- Other options' prices increase slightly

---

## Test 5: Add Option Dynamically

### Steps
1. Create a multi-option market with 3 options
2. Navigate to the market detail page
3. As market authority, find "Add Option" section
4. Enter new option name: "Option 4"
5. Click **Add**

### Expected Results
- Transaction succeeds
- New option added with 50 shares
- Option count increases to 4
- All existing options' prices decrease (dilution)
- New option shows 50 shares

### Price Dilution Verification
- Before: 3 options at 33.33% each
- After: 4 options, new total shares = 200
- Each option = 50/200 = 25% (price decreased)

---

## Test 6: Claim Payout (Winner - Binary)

### Steps
1. Navigate to a binary market you've bet on
2. As authority, click **YES Wins**
3. Navigate back to market
4. As the bettor, click **Claim Payout**

### Expected Results
- Payout = shares × 0.1 AMAF tokens
- Bet.claimed = true
- Tokens transferred from escrow to user
- Error if trying to claim again

### Calculation Example
- If you bought 100 shares: 100 × 0.1 = 10 AMAF tokens
- Verify payout amount matches calculation

---

## Test 7: Claim Payout (Loser - Binary)

### Steps
1. Navigate to a binary market resolved as YES wins
2. As a NO bettor, try to claim payout

### Expected Results
- Transaction fails with error: "Not a winning bet"
- No tokens transferred
- Bet.claimed remains false

---

## Test 8: Claim Payout (Winner - Multi)

### Steps
1. Navigate to a multi-option market
2. As authority, resolve with winner index 2
3. As winner bettor, click **Claim Payout**

### Expected Results
- Payout = shares × 0.1 AMAF tokens
- Bet.claimed = true
- Only winner receives payout

---

## Test 9: Cancel Market

### Steps
1. Create a new market
2. Navigate to market detail page
3. As authority, click **Cancel Market**

### Expected Results
- Market.resolved = true
- Market.outcome = Cancelled
- All bettors can claim proportional refunds
- Refund calculation: (user_shares / total_shares) × collateral_balance

### Refund Verification
- If market has 1000 total shares and user has 100 shares
- If collateral = 1000 AMAF tokens
- User receives: (100/1000) × 1000 = 100 AMAF tokens

---

## Test 10: Claim Daily AMAF

### Steps
1. Connect wallet
2. Claim daily tokens (button on main page)
3. Wait 24 hours
4. Try to claim again

### Expected Results
- First claim: 100,000,000,000 tokens minted (100 AMAF)
- DailyClaimState.last_claim updated to timestamp
- Second claim within 24h fails with "ClaimTooSoon" error
- After 24h: Second claim succeeds

---

## Test 11: Edge Cases

### Test 11.1: Buy When Total Shares = 0
1. Create a new market (has 50 virtual shares per option)
2. Buy shares immediately
3. Verify cost calculation uses virtual liquidity

### Test 11.2: Maximum Options (16)
1. Create a market with 16 options
2. Try to add a 17th option
3. Expected: Error "MaxOptionsReached"

### Test 11.3: Resolve Invalid Option Index
1. Resolve market with option index 100
2. Expected: Error "InvalidOptionIndex"

### Test 11.4: Cancel Already Resolved Market
1. Resolve a market
2. Try to cancel it
3. Expected: Error "MarketResolved"

### Test 11.5: Double Claim Payout
1. Claim payout for winning bet
2. Try to claim again
3. Expected: Error "AlreadyClaimed"

### Test 11.6: Add Option to Resolved Market
1. Resolve a market
2. Try to add new option
3. Expected: Error "MarketResolved"

### Test 11.7: Option Name Too Long
1. Try to add option with 51 characters
2. Expected: Error "OptionNameTooLong"

### Test 11.8: Create Market with Invalid Option Count
1. Try to create market with 1 option
2. Expected: Error "InvalidOptionCount"
3. Try to create market with 17 options
4. Expected: Error "InvalidOptionCount"

---

## Automated Testing

To run automated tests:

```bash
# Build the program
docker compose run --rm anchor anchor build

# Run all tests
docker compose run --rm anchor anchor test

# Run specific test file
docker compose run --rm anchor anchor test market_creation
docker compose run --rm anchor anchor test trading
docker compose run --rm anchor anchor test resolution
docker compose run --rm anchor anchor test preserved_features
```

---

## Test Results Checklist

### Market Creation
- [ ] Binary market created successfully
- [ ] Multi-option market created successfully
- [ ] Market type correctly set
- [ ] Initial shares = 50 per option
- [ ] Initial prices calculated correctly
- [ ] UserMarketsCounter increments

### Trading
- [ ] Buy shares on binary market
- [ ] Buy shares on multi-option market
- [ ] Price impact visible
- [ ] Collateral balance updates
- [ ] Bet record created

### Market Management
- [ ] Add option to market
- [ ] Price dilution visible
- [ ] Max options enforced (16)
- [ ] Cannot add to resolved market

### Resolution
- [ ] Resolve binary market
- [ ] Resolve multi-option market
- [ ] Cannot resolve invalid option
- [ ] Cannot resolve already resolved
- [ ] Cancel market succeeds

### Payouts
- [ ] Winner can claim
- [ ] Loser cannot claim
- [ ] Double-claim prevented
- [ ] Cancelled market refunds work

### Daily Claim
- [ ] Claim 100 tokens successfully
- [ ] 24-hour cooldown enforced
- [ ] Multiple users can claim independently

### Edge Cases
- [ ] Invalid option counts rejected
- [ ] Invalid option index rejected
- [ ] Max options enforced
- [ ] Option name length enforced
- [ ] All errors have clear messages

---

## Common Issues & Solutions

### Issue: Transaction Fails
**Solution**: Check wallet has sufficient SOL and AMAF tokens
```javascript
// Check balance
await connection.getTokenAccountBalance(userTokenAccount)
```

### Issue: Market Not Found
**Solution**: Ensure market PDA is correct and market exists on-chain
```javascript
// Fetch market
const market = await program.account.market.fetch(marketPda)
```

### Issue: Invalid Account
**Solution**: Verify all required accounts are included in transaction
```javascript
// Check account constraints
console.log('Mint:', mint.toBase58())
console.log('User Token:', userToken.toBase58())
console.log('Escrow Token:', escrowToken.toBase58())
```

---

## Performance Testing

### High-Load Scenarios

1. **Multiple Users Trading Simultaneously**
   - Open multiple browser tabs
   - Connect different wallets
   - Buy shares on same market
   - Verify all transactions succeed

2. **Large Trade Amounts**
   - Buy 1000+ shares
   - Verify price impact calculation
   - Check transaction completes within reasonable time

3. **Many Options**
   - Create market with 16 options
   - Add/buy across all options
   - Verify UI remains responsive

---

## Security Testing

### Attack Vectors to Test

1. **Unauthorized Resolution**
   - Try to resolve market as non-authority
   - Expected: Transaction fails

2. **Front-Running Protection**
   - Submit two buy transactions quickly
   - Verify both execute correctly
   - Check no duplicate bet accounts

3. **Replay Attacks**
   - Submit same signed transaction twice
   - Expected: Second one rejected

---

## Test Data Cleanup

To reset test state:

```bash
# Close all market PDAs (requires program upgrade)
# Or use a new wallet for fresh testing
```

---

## Test Report Template

```
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [Devnet/Localnet]

Test Results:
Test 1 (Binary Market Creation): PASS/FAIL - [Notes]
Test 2 (Multi-Option Market Creation): PASS/FAIL - [Notes]
Test 3 (Buy Binary Shares): PASS/FAIL - [Notes]
Test 4 (Buy Multi-Option Shares): PASS/FAIL - [Notes]
Test 5 (Add Option): PASS/FAIL - [Notes]
Test 6 (Claim Winner): PASS/FAIL - [Notes]
Test 7 (Claim Loser): PASS/FAIL - [Notes]
Test 8 (Claim Multi-Option Winner): PASS/FAIL - [Notes]
Test 9 (Cancel Market): PASS/FAIL - [Notes]
Test 10 (Daily Claim): PASS/FAIL - [Notes]
Test 11 (Edge Cases): PASS/FAIL - [Notes]

Overall: [PASS/FAIL]
```
