# Outstanding Issues - AMAF Prediction Market MVP

**Generated:** January 23, 2026  
**Status:** Development Phase - Pre-MVP

---

## CRITICAL ISSUES

### 1. Mint Initialization Failure (Complete Application Blocker)

**Problem:** The mint PDA (`6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG`) does not exist on devnet. All mint-based functionality is blocked.

**Root Cause - Anchor 0.31.1 IDL Library Compatibility Issue**

Two initialization approaches have failed:

**Approach 1: Manual Instruction Construction (Failed)**
- File: `initialize-mint-final.ts`, `init-mint-borsh.ts`
- Error: `InstructionFallbackNotFound` (Anchor Error Code 101)
- Details: Instruction constructed with discriminator `sha256("global:initializeMint")[:8]` = `4e9c3ce44d6dc7d5`
- Error Message: "Fallback functions are not supported"

**Approach 2: Anchor Program API (Failed)**
- File: `initialize-mint-anchor.ts`, `init-mint-anchor.cjs`
- Error: `TypeError: Cannot read properties of undefined (reading 'encode')`
- Root Cause: Anchor 0.31.1's `BorshAccountsCoder` expects account type definitions in `idl.types`, but the standard IDL format uses `idl.accounts` (or places types at top-level without an accounts array)
- Library attempts to encode instruction data using an undefined encoder object

**Current State:**
- Smart Contract: Deployed (signature: `5TcJZ2wHi52bNtZAL8oaeDX3jz14EwTtEgZ5UQpRHjBEtteUpLWZ4j2tVoEWtmakJFKCA3inHBLashZCsECxnnKG`)
- IDL: Deployed (account: `6B3UeseiXXcDAddiWEkBvopjbZy3yDCGQigPW882bRMm`)
- Program ID: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn`
- Mint PDA: **Does not exist**

**Impact:** Complete application failure. Users cannot:
- Claim daily AMAF tokens
- Create markets
- Place bets
- Receive payouts

---

## HIGH PRIORITY ISSUES

### 2. Missing Claim Payout UI

**File:** `src/routes/markets/$id.tsx:230-238`

**Problem:** Smart contract implements `claimPayout` instruction (`src/lib/idl/amafcoin.json:175-224`), but no frontend UI exists for users to collect winnings.

**Current Behavior:** Markets can be resolved to show "YES Wins" or "NO Wins", but no action button exists for winners to claim their tokens.

**Smart Contract Reference:**
```rust
// programs/amafcoin/src/lib.rs:84-114
pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
    // Payout logic implemented
}
```

**Required Frontend Implementation:**
- "Claim Payout" button (visible to winners of resolved markets where bet.claimed == false)
- Handler calling `program.methods.claimPayout()` with required accounts
- Success/error state management
- UI update after successful claim (set bet.claimed = true, disable button)

---

### 3. Missing Cancel Market UI

**File:** `src/routes/markets/$id.tsx:289-301`

**Problem:** Smart contract implements `cancelMarket` instruction (`programs/amafcoin/src/lib.rs:75-82`), but no UI button exists for market authorities to cancel unresolved markets.

**Current Behavior:** Only "YES Wins" and "NO Wins" resolution buttons available. Markets cannot be canceled for invalid questions or cheating.

**Smart Contract Reference:**
```rust
// programs/amafcoin/src/lib.rs:75-82
pub fn cancel_market(ctx: Context<CancelMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(!market.resolved, MarketAlreadyResolved);
    market.resolved = true;
    market.outcome = false; // Cancelled outcome
    Ok(())
}
```

**Required Frontend Implementation:**
- "Cancel Market" button (visible only to market.authority when market.resolved == false)
- Confirmation dialog before cancelling
- Handler calling `program.methods.cancelMarket()` with required accounts
- Success/error state management
- UI update to show "Cancelled" status

---

### 4. No Bet Listing Display

**File:** `src/routes/markets/$id.tsx`

**Problem:** Market detail page does not show individual bets placed on YES/NO sides. Smart contract has `Bet` account struct (`src/lib/idl/amafcoin.json:363-390`), but frontend only displays pool totals.

**Smart Contract Reference:**
```rust
// programs/amafcoin/src/lib.rs:142-149
#[account]
pub struct Bet {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub sideYes: bool,
    pub claimed: bool,
}
```

**Current Behavior:**
```tsx
// Shows only pool totals
<div>
  <div>YES Pool: {formatAmount(market.totalYes)} AMAF</div>
  <div>NO Pool: {formatAmount(market.totalNo)} AMAF</div>
</div>
```

**Required Frontend Implementation:**
- Fetch all bet accounts for the market using `getProgram().account.bet.all()`
- Filter bets by `bet.market === marketKey`
- Display two sections: "YES Bets" and "NO Bets"
- For each bet, show:
  - User public key (truncated)
  - Amount bet
  - Claimed status (icon/text)
  - Timestamp (if stored)
- Optional: Link to user profile or bet details

---

## MEDIUM PRIORITY ISSUES

### 5. Hardcoded Devnet Connection URLs

**Locations:**
- `src/components/DailyAmafClaim.tsx:35,80`
- `src/routes/markets/$id.tsx:35,76,150`
- `src/routes/markets/create.tsx:53`
- `src/routes/markets/index.tsx:25`
- `src/data/verify-mint.ts:6`

**Problem:** Connection endpoint hardcoded to `https://api.devnet.solana.com` in 6+ files. No environment variable configuration for network switching.

**Current Implementation:**
```typescript
const connection = new Connection('https://api.devnet.solana.com')
```

**Required Fix:**
```typescript
// Create .env file
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

// Update all files
const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com')
```

**Impact:** Mainnet deployment requires manual file-by-file changes. High risk of missing a URL during deployment.

---

### 6. Duplicate PDA Utility Functions

**Files:** `src/data/markets.ts:65-77`, `src/data/tokens.ts:9-21`

**Problem:** `getMintPDA()` and `getProgramAuthorityPDA()` functions duplicated in both files.

**Duplicate Code:**
```typescript
// src/data/tokens.ts
export function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    PROGRAM_ID
  )
}

// src/data/markets.ts (identical)
export function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    PROGRAM_ID
  )
}
```

**Required Fix:**
1. Keep token-related PDA functions in `src/data/tokens.ts`
2. Keep market-related PDA functions in `src/data/markets.ts`
3. Update `src/data/markets.ts` to import from `src/data/tokens.ts`:
```typescript
export { getMintPDA, getProgramAuthorityPDA } from './tokens'
```

**Impact:** Maintenance burden. Changes may be applied to one file but not the other, causing divergence.

---

### 7. Missing Escrow Token Account Creation

**File:** `src/routes/markets/$id.tsx:88-96`

**Problem:** `placeBet()` creates user ATA if needed but does not create escrow ATA for new markets. `getEscrowTokenAccount()` only returns address, not creation instruction.

**Current Implementation:**
```typescript
// Creates user ATA
const { address: userToken, instruction: createUserAtaIx } = 
  await getOrCreateUserTokenAccount(publicKey, mintPda, connection, publicKey)

// Only returns escrow address, no creation instruction
const escrowToken = getEscrowTokenAccount(marketKey, mintPda)

// If escrow ATA doesn't exist, transaction fails
```

**Required Fix:**
Add escrow ATA creation instruction to transaction if it doesn't exist:
```typescript
// Check if escrow ATA exists
const escrowTokenAccount = await connection.getAccountInfo(escrowToken)

if (!escrowTokenAccount) {
  // Create escrow ATA instruction
  const createEscrowAtaIx = createAssociatedTokenAccountInstruction(
    publicKey, // payer
    escrowToken, // ata
    marketKey, // owner
    mintPda, // mint
  )
  transaction.add(createEscrowAtaIx)
}
```

**Risk:** New markets may allow betting, but transactions will fail if escrow ATA doesn't exist.

---

### 8. Missing Comprehensive Testing

**Directory:** `tests/`

**Problem:** Only `tests/initialize-mint.spec.ts` exists. No unit tests, integration tests, or E2E tests for core functionality. Test file uses incorrect IDL path (`./rust/idl.json` vs `src/lib/idl/amafcoin.json`).

**Current State:**
```
tests/
└── initialize-mint.spec.ts  (1 test file, incorrect IDL path)
```

**Required Test Suite:**

**Unit Tests:**
- PDA calculation utilities (`getMintPDA`, `getMarketPDA`, etc.)
- ATA address calculation utilities
- Amount formatting utilities

**Integration Tests:**
- Market creation flow
- Betting flow (YES/NO)
- Market resolution flow
- Payout claim flow
- Daily claim flow
- Cancel market flow

**E2E Tests (Vitest + React Testing Library):**
- DailyAmafClaim component
- Market creation form
- Market detail page (betting, resolution)
- Market listing page

**Fix Required:**
```typescript
// tests/initialize-mint.spec.ts
// Change line X from:
import idl from './rust/idl.json'

// To:
import idl from '../src/lib/idl/amafcoin.json'
```

**Impact:** Low confidence in application correctness. High regression risk.

---

## LOW PRIORITY ISSUES

### 9. Console.log in Production Code

**Count:** 81 instances across multiple files

**Locations:**
- `src/routes/markets/$id.tsx` (5 instances: lines 51, 133, 136, 165, 168)
- `src/components/DailyAmafClaim.tsx` (3 instances: lines 47, 137, 140)
- `src/routes/markets/create.tsx` (2 instances: lines 73, 76)
- `src/routes/markets/index.tsx` (1 instance: line 30)
- `src/data/markets.ts` (1 instance: line 50)
- `src/data/verify-mint.ts` (3 instances: lines 15, 16, 19)
- Various initialization scripts

**Examples:**
```typescript
console.log('Market created:', marketKey.toString())
console.error('Error claiming daily AMAF:', err)
console.warn('No markets found')
```

**Required Fix:**
1. Replace with proper logging library (e.g., `loglevel`):
```typescript
import log from 'loglevel'
log.setLevel(import.meta.env.PROD ? 'error' : 'debug')
log.info('Market created:', marketKey.toString())
log.error('Error claiming:', err)
```

2. Or remove entirely for production builds

**Impact:** Minor performance overhead. May expose sensitive information in production logs.

---

### 10. Anti-Pattern: window.location.reload()

**File:** `src/routes/markets/$id.tsx:166`

**Problem:** Full page reload after market resolution breaks SPA experience. Causes loss of scroll position and temporary state.

**Current Implementation:**
```typescript
setLoading(false)
alert('Market resolved successfully!')
window.location.reload() // Line 166
```

**Required Fix:**
```typescript
// Option 1: Refetch market data
const router = useRouter()
await router.invalidate()
setLoading(false)
alert('Market resolved successfully!')

// Option 2: Use state update
setMarket(updatedMarket)
setLoading(false)
alert('Market resolved successfully!')
```

**Impact:** Poor UX. Should use router navigation or state updates.

---

### 11. Empty Error Catch Block

**File:** `src/data/tokens.ts:50-51`

```typescript
} catch (error) {
}
```

**Problem:** Silent failures when checking ATA existence. Difficult to debug issues.

**Current Context:**
```typescript
export async function checkAtaExists(connection: Connection, address: PublicKey): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(address)
    return accountInfo !== null
  } catch (error) {
    return false // Silent failure
  }
}
```

**Required Fix:**
```typescript
} catch (error) {
  console.error('Error checking ATA existence:', error)
  return false
}
```

**Impact:** Silent failures when checking ATA existence. Difficult to debug issues.

---

### 12. No React Error Boundaries

**Scope:** All React components

**Problem:** No error boundaries implemented. Component errors crash entire app with white screen.

**Required Implementation:**
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong. Please refresh the page.</div>
    }
    return this.props.children
  }
}

// Usage in __root.tsx
<ErrorBoundary>
  <Outlet />
</ErrorBoundary>
```

**Impact:** Poor error handling. No graceful recovery from component failures.

---

### 13. Mock Wallet Code Smell

**Files:** `src/routes/markets/index.tsx:26`, `src/routes/markets/$id.tsx:36`

```typescript
const wallet = { publicKey, signTransaction: () => null, signAllTransactions: () => null }
```

**Problem:** Works for data fetching but confusing without comments or documentation.

**Current Context:**
```typescript
// Used for read-only data fetching
const program = await getProgram(
  connection,
  { publicKey, signTransaction: () => null, signAllTransactions: () => null },
  PROGRAM_ID,
  idl
)
```

**Required Fix:**
```typescript
// Create utility function
function createMockWallet(publicKey: PublicKey) {
  return {
    publicKey,
    signTransaction: () => null,
    signAllTransactions: () => null
  }
}

// Usage with comment
// Mock wallet for read-only data fetching (no signing required)
const wallet = createMockWallet(publicKey)
```

**Impact:** Code readability. Purpose unclear without comments.

---

### 14. No Input Sanitization

**Files:** `src/routes/markets/create.tsx`, `src/routes/markets/$id.tsx`

**Problem:** Market questions and descriptions not sanitized before display. Smart contract has length limits but no content validation.

**Smart Contract Limits:**
```rust
// programs/amafcoin/src/lib.rs
const MAX_QUESTION_LENGTH: usize = 200;
const MAX_DESCRIPTION_LENGTH: usize = 1000;

#[account]
pub struct Market {
    pub question: String,  // Max 200 chars
    pub description: String, // Max 1000 chars
    // ...
}
```

**Required Implementation:**
```typescript
// src/lib/utils/validation.ts
import DOMPurify from 'dompurify'

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input)
}

export function validateQuestion(question: string): { valid: boolean; error?: string } {
  if (question.length === 0) return { valid: false, error: 'Question is required' }
  if (question.length > 200) return { valid: false, error: 'Question too long (max 200 chars)' }
  return { valid: true }
}

export function validateDescription(description: string): { valid: boolean; error?: string } {
  if (description.length > 1000) return { valid: false, error: 'Description too long (max 1000 chars)' }
  return { valid: true }
}

// Usage in create.tsx
const sanitizedQuestion = sanitizeInput(question)
const { valid, error } = validateQuestion(sanitizedQuestion)
```

**Risk:** Potential XSS if data displayed in untrusted contexts.

---

### 15. No Transaction Confirmation Dialogs

**Scope:** All transaction handlers

**Problem:** Transactions execute immediately without confirmation. No "Are you sure?" for betting with real tokens.

**Required Implementation:**
```typescript
// src/lib/utils/confirmation.ts
export async function confirmTransaction(
  action: string,
  details: string
): Promise<boolean> {
  const message = `${action}\n\n${details}\n\nAre you sure you want to proceed?`
  return window.confirm(message)
}

// Usage in $id.tsx (placeBet)
const confirmed = await confirmTransaction(
  'Place Bet',
  `${sideYes ? 'YES' : 'NO'} - ${amount} AMAF on: "${market.question}"`
)
if (!confirmed) return

setLoading(true)
try {
  // Execute transaction
}
```

**Impact:** User may accidentally bet wrong amount or side.

---

### 16. Missing Loading States

**Scope:** First-time ATA creation, mint initialization

**Problem:** When user ATA needs creation, no loading indicator. Users may think transaction is stuck.

**Current Implementation:**
```typescript
const { address: userToken, instruction: createUserAtaIx } = 
  await getOrCreateUserTokenAccount(publicKey, mintPda, connection, publicKey)

if (createUserAtaIx) {
  // No loading state during ATA creation
  transaction.add(createUserAtaIx)
}
```

**Required Fix:**
```typescript
const [creatingAta, setCreatingAta] = useState(false)

// ...
if (createUserAtaIx) {
  setCreatingAta(true)
  transaction.add(createUserAtaIx)
}

// In JSX
{creatingAta && <p>Creating token account...</p>}
```

**Impact:** Poor UX during first-time interactions.

---

### 17. Missing Transaction Progress Indicators

**Scope:** All transactions

**Problem:** Long transactions show no status (pending/confirming/failed).

**Required Implementation:**
```typescript
import { useTransactionStatus } from '@/hooks/useTransactionStatus'

function MarketDetail() {
  const { status, monitorTransaction } = useTransactionStatus()

  const handleTransaction = async (transaction: Transaction) => {
    setLoading(true)
    try {
      const signature = await signAndSendTransaction(transaction)
      monitorTransaction(signature) // Start monitoring
      // ...
    }
  }

  return (
    <>
      {status === 'pending' && <div>Transaction pending...</div>}
      {status === 'confirming' && <div>Confirming on blockchain...</div>}
      {status === 'success' && <div>Transaction confirmed!</div>}
      {status === 'failed' && <div>Transaction failed. Please try again.</div>}
    </>
  )
}
```

**Impact:** Poor UX. Should show transaction status.

---

### 18. No Transaction Recovery Flow

**Scope:** Failed transactions

**Problem:** Failed transactions only show error message. No retry mechanism or recovery guidance.

**Required Implementation:**
```typescript
const [error, setError] = useState('')
const [failedTransaction, setFailedTransaction] = useState<any>(null)

const handleError = (err: any, transaction: any) => {
  console.error('Transaction failed:', err)
  setError(err.message)
  setFailedTransaction(transaction)
}

const handleRetry = async () => {
  setError('')
  await handleTransaction(failedTransaction)
}

// In JSX
{error && (
  <div className="error">
    <p>{error}</p>
    <button onClick={handleRetry}>Retry</button>
    <button onClick={() => setError('')}>Dismiss</button>
  </div>
)}
```

**Impact:** Frustrating user experience. Should offer retry options.

---

## CONFIGURATION ISSUES

### 19. Anchor Version Mismatch

**Files:** `Anchor.toml`, `package.json`

```toml
# Anchor.toml
[toolchain]
anchor_version = "0.31.1"
```

```json
// package.json
{
  "dependencies": {
    "@coral-xyz/anchor": "^0.31.1",
    "@coral-xyz/anchor-cli": "^0.31.2"
  }
}
```

**Problem:** Minor version mismatch between CLI and library.

**Required Fix:**
```json
{
  "dependencies": {
    "@coral-xyz/anchor": "^0.31.1",
    "@coral-xyz/anchor-cli": "^0.31.1" // Match CLI version to anchor_version
  }
}
```

**Impact:** Potential compatibility issues. Should align versions.

---

## DEPENDENCY WARNINGS

### 20. Punycode Deprecation Warning

**Source:** `@solana/web3.js` dependency

**Status:** Non-critical. Will be fixed in future dependency updates.

**Message:** `punycode module is deprecated`

**Action:** Monitor for future @solana/web3.js releases.

---

### 21. Localstorage Warning

**Source:** Phantom wallet adapter configuration

**Status:** Does not affect functionality. Configuration issue.

**Message:** Warning about `--localstorage-file` flag in some wallet configurations.

**Action:** Ignore or update wallet adapter configuration if issues arise.

---

## SUMMARY

### Issue Breakdown

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 1 | Mint initialization failure |
| High | 3 | Claim payout UI, Cancel market UI, Bet listing display |
| Medium | 4 | Hardcoded URLs, Duplicate PDA functions, Escrow ATA creation, Missing tests |
| Low | 16 | Code quality, UX issues, Minor bugs |
| **Total** | **26** | |

### Immediate Action Required

1. **Fix mint initialization** (CRITICAL)
   - Research Anchor 0.31.1 IDL format requirements
   - Try alternative approaches:
     - Downgrade Anchor library to 0.30.x
     - Use `anchor-cli test` with local validator
     - Create integration test using Anchor's test framework
     - Use raw Solana Web3.js with correct instruction encoding

### Short-term (This Sprint)

2. Add claim payout UI
3. Add cancel market UI
4. Display bet listings on market detail page
5. Implement escrow ATA creation check and creation
6. Consolidate PDA utility functions (remove duplicates)
7. Fix hardcoded URLs with environment configuration
8. Add comprehensive testing suite

### Medium-term

9. Remove console.log statements
10. Replace window.location.reload with proper navigation
11. Add loading states and progress indicators
12. Implement transaction retry mechanism
13. Add input sanitization and validation
14. Add transaction confirmation dialogs

### Long-term

15. Implement betting history page
16. Add notification system for resolved markets
17. Add error boundaries throughout app
18. Improve error handling and recovery flows

### Files Requiring Immediate Attention

**Mint Initialization:**
- `initialize-mint-final.ts` - Manual instruction approach
- `initialize-mint-anchor.ts` - Anchor library approach
- `src/lib/idl/amafcoin.json` - IDL format validation

**Missing UI Features:**
- `src/routes/markets/$id.tsx` - Claim payout, cancel market, bet listing

**Code Quality:**
- Multiple files with hardcoded URLs (use grep: `'https://api.devnet.solana.com'`)
- `src/data/markets.ts`, `src/data/tokens.ts` - Duplicate PDA functions

**Testing:**
- `tests/initialize-mint.spec.ts` - Fix IDL path
- Create new test files for all components and flows

---

## Related Documentation

- `phase-8-testing-summary.md` - Mint initialization testing results
- `src/lib/idl/amafcoin.json` - Complete IDL with all instructions
- `programs/amafcoin/src/lib.rs` - Smart contract implementation
- `AGENTS.md` - Build/test commands and code style guidelines
