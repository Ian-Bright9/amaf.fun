# Outstanding Issues - AMAF Prediction Market MVP

**Generated:** January 23, 2026  
**Status:** Development Phase - Pre-MVP

---

This file its a pruned version of outstanding-issues.md with only the issues relevant to the anchor config and TS integration with the Solana smartcontract.

## CRITICAL ISSUES

### 1. Mint Initialization Failure ~~(Complete Application Blocker)~~ ✅ RESOLVED

**Problem:** ~~The mint PDA (`6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG`) does not exist on devnet. All mint-based functionality is blocked.~~

**Status:** ✅ **RESOLVED** - Mint is initialized and operational on devnet (2026-01-27)

**Current State:**
- Smart Contract: Deployed (signature: `5TcJZ2wHi52bNtZAL8oaeDX3jz14EwTtEgZ5UQpRHjBEtteUpLWZ4j2tVoEWtmakJFKCA3inHBLashZCsECxnnKG`)
- IDL: Deployed (account: `6B3UeseiXXcDAddiWEkBvopjbZy3yDCGQigPW882bRMm`)
- Program ID: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn`
- Mint PDA: `6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG` ✅ **EXISTS**
- Mint Authority: `GU1yZTcaLCRnDrMiQeHboUAEBCBPu5KFy2FhA3xm65mc` (Program Authority PDA)
- Decimals: 9
- Supply: 0
- Owner: Token Program (correct)

**Impact:** ~~Complete application failure.~~ Users can now:
- ✅ Claim daily AMAF tokens
- ✅ Create markets
- ✅ Place bets
- ✅ Receive payouts

---

### 2. Critical IDL Field Naming Mismatch ~~(Complete Application Blocker)~~ ✅ RESOLVED

**Files Affected:** `src/lib/idl/amafcoin.json`, `rust/idl.json`

**Problem:** ~~Error `TypeError: this._coder.accounts is undefined` occurs when attempting to create Program or interact with any program account. All Anchor program functionality is completely blocked.~~

**Status:** ✅ **RESOLVED** - Fixed struct field names to snake_case (2026-01-27)

**Resolution:**

| Type Field | Fixed (snake_case) | Previous (camelCase) |
|-----------|---------------------|-------------------|
| `Bet.side_yes` | ✅ `side_yes` | ~~`sideYes`~~ |
| `DailyClaimState.last_claim` | ✅ `last_claim` | ~~`lastClaim`~~ |
| `Market.total_yes` | ✅ `total_yes` | ~~`totalYes`~~ |
| `Market.total_no` | ✅ `total_no` | ~~`totalNo`~~ |

**Error Stack Trace:**
```
Error claiming daily AMAF: TypeError: this._coder.accounts is undefined
    AccountClient account.ts:121
    build account.ts:28
    build account.ts:27
    build index.ts:56
    _Program index.ts:299
    getProgram markets.ts:28
    handleClaim DailyAmafClaim.tsx:81
```

**Why This Fails:**

1. Anchor 0.31.1 BorshCoder tries to initialize account coders from `idl.types`
2. It attempts to read field names from type definitions
3. Field names don't match what the Rust program uses
4. Coder initialization fails, making `this._coder.accounts` undefined
5. Any program.account operation (fetch, decode, etc.) throws undefined error

**What Should Be Converted vs What Shouldn't:**

**✓ Convert to camelCase:**
- Instruction names: `claim_daily_amaf` → `claimDailyAmaf`
- Account type names: `DailyClaimState` → `DailyClaimState` (already correct)
- Instruction argument names: `side_yes` → `sideYes`
- Instruction account names: `user_token` → `userToken`

**✗ Keep as snake_case:**
- Struct field names in `types` array: `sideYes` → `side_yes`

**Impact:** Complete application failure. All program interactions blocked:
- Cannot create Program instances
- Cannot fetch account data (markets, bets, claim states)
- Cannot decode account data
- Cannot execute any instructions

**Required Fix:**

1. Update IDL conversion script to preserve snake_case for struct field names:
```javascript
function convertIdl(idl) {
  const converted = JSON.parse(JSON.stringify(idl))
  
  if (converted.instructions) {
    converted.instructions = converted.instructions.map(instr => ({
      ...instr,
      name: toCamelCase(instr.name),  // ✓ Convert
      accounts: instr.accounts.map(acc => ({
        ...acc,
        name: toCamelCase(acc.name)  // ✓ Convert
      })),
      args: (instr.args || []).map(arg => ({
        ...arg,
        name: toCamelCase(arg.name)  // ✓ Convert
      }))
    }))
  }
  
  if (converted.types) {
    converted.types = converted.types.map(type => ({
      ...type,
      name: toCamelCase(type.name),  // ✓ Convert
      type: {
        ...type.type,
        fields: type.type.fields.map(field => ({
          ...field,
          name: field.name  // ✗ DO NOT CONVERT - keep snake_case
        }))
      }
    }))
  }
  
  return converted
}
```

2. Regenerate both IDL files with corrected script:
```bash
node scripts/convert-idl.js > src/lib/idl/amafcoin.json
node scripts/convert-idl.js > rust/idl.json
```

3. Verify Program can be instantiated:
```javascript
const program = new Program(idl, PROGRAM_ID, provider)
console.log('✓ Program coder initialized:', !!program.coder)
console.log('✓ Account coder initialized:', !!program.coder?.accounts)
```

---

## MEDIUM PRIORITY ISSUES

### 2. Anchor Version Mismatch

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


### 3. Hardcoded Devnet Connection URLs

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

### 4. Duplicate PDA Utility Functions

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

### 5. Missing Escrow Token Account Creation

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

### 6. Empty Error Catch Block

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

### 7. No Input Sanitization

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

### 8. Missing Loading States

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

### 9. Missing Transaction Progress Indicators

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

### 10. No Transaction Recovery Flow

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

## DEPENDENCY WARNINGS

### Punycode Deprecation Warning

**Source:** `@solana/web3.js` dependency

**Status:** Non-critical. Will be fixed in future dependency updates.

**Message:** `punycode module is deprecated`

**Action:** Monitor for future @solana/web3.js releases.

---

### Localstorage Warning

**Source:** Phantom wallet adapter configuration

**Status:** Does not affect functionality. Configuration issue.

**Message:** Warning about `--localstorage-file` flag in some wallet configurations.

**Action:** Ignore or update wallet adapter configuration if issues arise.

---

### Immediate Action Required

~~1. **Fix mint initialization** (CRITICAL)~~ ✅ RESOLVED
    ~~- Research Anchor 0.31.1 IDL format requirements~~
    ~~- Try alternative approaches:~~
      ~~- Downgrade Anchor library to 0.30.x~~
      ~~- Use `anchor-cli test` with local validator~~
      ~~- Create integration test using Anchor's test framework~~
      ~~- Use raw Solana Web3.js with correct instruction encoding~~

### Files Requiring Attention

**Mint Initialization:** ✅ RESOLVED
- ~~`initialize-mint-final.ts` - Manual instruction approach~~
- ~~`initialize-mint-anchor.ts` - Anchor library approach~~
- `src/lib/idl/amafcoin.json` - IDL format validated ✅

**IDL Field Naming:** ✅ RESOLVED
- `src/lib/idl/amafcoin.json` - Fixed struct field names ✅
- `rust/idl.json` - Fixed struct field names ✅

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
