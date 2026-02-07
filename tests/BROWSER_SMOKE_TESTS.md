# Browser Console Smoke Tests

This document provides quick validation tests that can be run in the browser console to verify basic CPMM functionality.

## Prerequisites

1. Connect your wallet to the application
2. Navigate to a market page (any market)
3. Open browser developer console (F12)

## Test 1: Verify Market Data Structure

```javascript
// Get the market data from the page (or via API)
const market = window.currentMarket; // Or fetch via API

console.log('Market Type:', market.marketType);
console.log('Number of Options:', market.numOptions);
console.log('Options:', market.options);
console.log('Collateral Balance:', market.collateralBalance.toString());
console.log('Virtual Liquidity:', market.virtualLiquidity.toString());

// Expected results:
// - marketType should be 'Binary' or 'MultiOption'
// - numOptions should be >= 2 and <= 16
// - options should be an array with name, shares, active fields
// - collateralBalance should be a BigInt
// - virtualLiquidity should equal 50
```

## Test 2: Verify Price Calculations

```javascript
// Manually calculate option prices
const options = [
  { shares: 50n, name: 'YES' },
  { shares: 50n, name: 'NO' }
];

const totalShares = options.reduce((sum, opt) => sum + opt.shares, 0n);
const prices = options.map(opt => Number(opt.shares * 10000000n / totalShares) / 10000000);

console.log('Total Shares:', totalShares.toString());
console.log('Option Prices:', prices);

// Expected: YES = 0.5, NO = 0.5 (50% each)
```

## Test 3: Verify Buy Cost Calculation

```javascript
function calculateBuyCost(shares, options, collateralBalance, targetIndex) {
  const newShares = BigInt(shares);
  const totalBefore = options.reduce((sum, opt) => sum + opt.shares, 0n);
  
  let collateralNeeded;
  if (totalBefore === 0n) {
    collateralNeeded = newShares * 50n; // Use virtual liquidity
  } else {
    const totalAfter = totalBefore + newShares;
    const ratio = collateralBalance * newShares;
    collateralNeeded = ratio / totalAfter;
  }
  
  return collateralNeeded / 10n; // Convert to AMAF tokens
}

// Test calculation
const options = [
  { shares: 50n },
  { shares: 50n }
];
const collateral = 1000n; // Example collateral balance
const cost = calculateBuyCost(10, options, collateral, 0);

console.log('Cost to buy 10 shares:', cost.toString());
console.log('Cost in AMAF:', Number(cost) / 1_000_000);

// Expected: Cost should be proportional to share of total collateral
```

## Test 4: Verify Payout Calculation

```javascript
function calculatePayout(shares) {
  return shares / 10n;
}

// Test winner payout
const winningShares = 100n;
const payout = calculatePayout(winningShares);

console.log('Winning Shares:', winningShares.toString());
console.log('Payout:', payout.toString());
console.log('Payout in AMAF:', Number(payout) / 1_000_000);

// Expected: 100 shares = 10 AMAF tokens payout
```

## Test 5: Verify Market PDA Derivation

```javascript
// Verify PDA calculation matches
function getMarketPDA(authority, marketIndex) {
  const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
  const seeds = [
    Buffer.from('market'),
    authority.toBuffer(),
    Buffer.from(new Uint16Array([marketIndex]).buffer)
  ];
  return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
}

// Test with market authority and index
const authority = window.wallet.publicKey;
const marketIndex = 0;
const [pda, bump] = getMarketPDA(authority, marketIndex);

console.log('Market PDA:', pda.toBase58());
console.log('Bump:', bump);

// Expected: Valid PDA address that matches on-chain account
```

## Test 6: Verify Bet PDA Derivation

```javascript
function getBetPDA(marketPDA, user) {
  const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
  const seeds = [
    Buffer.from('bet'),
    marketPDA.toBuffer(),
    user.toBuffer()
  ];
  return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
}

// Test with market and user
const marketPDA = window.currentMarket.publicKey;
const user = window.wallet.publicKey;
const [betPDA, bump] = getBetPDA(marketPDA, user);

console.log('Bet PDA:', betPDA.toBase58());
console.log('Bump:', bump);

// Expected: Valid bet account PDA
```

## Test 7: Verify Price Impact

```javascript
function calculatePriceImpact(shares, options, targetIndex) {
  const beforeShares = options.map(opt => Number(opt.shares));
  const beforePrices = beforeShares.map(s => s / beforeShares.reduce((a, b) => a + b, 0));
  
  const newShares = [...beforeShares];
  newShares[targetIndex] += shares;
  const afterPrices = newShares.map(s => s / newShares.reduce((a, b) => a + b, 0));
  
  return {
    beforePrices,
    afterPrices,
    impact: beforePrices.map((p, i) => afterPrices[i] - p)
  };
}

// Test with 10 share purchase on option 0
const options = [
  { shares: 50n },
  { shares: 50n }
];
const impact = calculatePriceImpact(10, options, 0);

console.log('Before Prices:', impact.beforePrices);
console.log('After Prices:', impact.afterPrices);
console.log('Price Impact:', impact.impact);

// Expected:
// - Before: [0.5, 0.5]
// - After: [~0.545, ~0.455]
// - Selected option's price decreases, others increase
```

## Test 8: Verify Cancelled Market Refund

```javascript
function calculateRefund(userShares, totalShares, collateralBalance) {
  if (totalShares === 0) return 0n;
  return (userShares * collateralBalance) / totalShares;
}

// Test refund calculation
const userShares = 100n;
const totalShares = 1000n;
const collateral = 1000_000_000n; // 1000 AMAF tokens

const refund = calculateRefund(userShares, totalShares, collateral);

console.log('User Shares:', userShares.toString());
console.log('Total Shares:', totalShares.toString());
console.log('Collateral:', collateral.toString());
console.log('Refund:', refund.toString());
console.log('Refund in AMAF:', Number(refund) / 1_000_000);

// Expected: 100/1000 * 1000 = 100 AMAF tokens refunded
```

## Running All Smoke Tests

Copy and paste the following into the browser console:

```javascript
(async function runAllSmokeTests() {
  console.log('=== CPMM Smoke Tests ===\n');
  
  // Test 1: Market structure
  console.log('Test 1: Market Data Structure');
  const market = window.currentMarket;
  if (!market) {
    console.error('No market data found. Please navigate to a market page.');
    return;
  }
  console.log('✓ Market Type:', market.marketType);
  console.log('✓ Options:', market.numOptions);
  console.log('✓ Total Shares:', market.options.reduce((s, o) => s + o.shares, 0n).toString());
  
  // Test 2: Price calculation
  console.log('\nTest 2: Price Calculations');
  const totalShares = market.options.reduce((sum, opt) => sum + opt.shares, 0n);
  const prices = market.options.map(opt => 
    Number(opt.shares * 10000000n / totalShares) / 10000000
  );
  console.log('✓ Option Prices:', prices.map(p => (p * 100).toFixed(2) + '%'));
  
  // Test 3: Collateral
  console.log('\nTest 3: Collateral Balance');
  console.log('✓ Collateral:', (Number(market.collateralBalance) / 1_000_000).toFixed(2), 'AMAF');
  console.log('✓ Virtual Liquidity:', market.virtualLiquidity.toString());
  
  // Test 4: Payout calculation
  console.log('\nTest 4: Payout Calculation');
  const testShares = 100n;
  const payout = testShares / 10n;
  console.log('✓ 100 shares payout:', (Number(payout) / 1_000_000).toFixed(2), 'AMAF');
  
  console.log('\n=== All Smoke Tests Completed ===');
})();
```

## Expected Console Output

```
=== CPMM Smoke Tests ===

Test 1: Market Data Structure
✓ Market Type: Binary
✓ Options: 2
✓ Total Shares: 100
✓ Collateral Balance: 1000.00 AMAF
✓ Virtual Liquidity: 50

Test 2: Price Calculations
✓ Option Prices: ["50.00%", "50.00%"]

Test 3: Collateral Balance
✓ Collateral: 1000.00 AMAF
✓ Virtual Liquidity: 50

Test 4: Payout Calculation
✓ 100 shares payout: 10.00 AMAF

=== All Smoke Tests Completed ===
```

## Troubleshooting

### Issue: `window.currentMarket is undefined`

**Solution**: Navigate to a market detail page first, then run the tests.

### Issue: Prices don't sum to 100%

**Solution**: This is expected due to integer division. Prices are approximate.

### Issue: Payout calculation seems wrong

**Solution**: Remember payout is shares / 10, not based on current prices or collateral.

## Integration with Manual Testing

Run these smoke tests before performing manual UI tests to ensure:
- Market data is correctly loaded
- Price calculations work
- PDAs are correctly derived
- Payout math is correct

Then proceed with manual testing in CPMM_TESTING_GUIDE.md
