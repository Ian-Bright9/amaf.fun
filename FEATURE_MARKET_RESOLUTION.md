# Market Resolution & Cancellation Feature Plan

## Overview

Add UI for market owners to resolve markets as YES/NO or cancel them. The smart contract already supports both operations.

## User Experience Decisions

Based on project requirements:

- **Button Visibility**: Visible but disabled for non-owners with explanatory tooltip
- **UI Placement**: Modal popup for resolving/cancelling
- **Confirmation Flow**: Modal includes wallet sign (single confirmation step)
- **Timing Restrictions**: No restrictions - owners can resolve/cancel anytime

---

## Phase 1: Backend Preparation

### 1.1 Rebuild Anchor Program (One-time)

**Action**: Run `make build` to regenerate IDL with `cancel_market` instruction

**Reason**: Current IDL is missing the cancel instruction

**File affected**: `src/lib/idl/amafcoin.json` (auto-generated)

**Verification**: Check that `cancelMarket` instruction appears in regenerated IDL

### 1.2 Create Cancel API Route

**New file**: `src/routes/api/contracts/[id]/cancel/+server.ts`

**Pattern**: Follow existing `+resolve/+server.ts:9-80` structure

**Request body**:

```typescript
{
	contractId: string;
	authority: string;
}
```

**Response**:

```typescript
{
	transaction: string; // base64 serialized transaction
	message: string;
}
```

**Implementation**:

- Validate required fields (400 error if missing)
- Create transaction using `program.instruction.cancelMarket()`
- Use accounts: `market`, `authority`
- Serialize transaction without requiring signatures
- Return base64-encoded transaction for wallet signing

### 1.3 Add Cancel API Client Function

**File**: `src/lib/api/contracts.ts` (add at end, after line 104)

**Function signature**:

```typescript
export async function cancelContract(
	params: {
		contractId: string;
	},
	fetchFn?: typeof fetch
): Promise<{ transaction: string }>;
```

**Implementation**:

- POST to `/api/contracts/${params.contractId}/cancel`
- Include wallet public key in request body
- Handle 400/500 errors with descriptive messages
- Return transaction string for wallet signing

---

## Phase 2: UI Components

### 2.1 Market Management Modal

**New component**: `src/lib/components/MarketManagementModal.svelte`

**Props**:

```typescript
interface Props {
	contract: Contract;
	isOpen: boolean;
	onClose: () => void;
}
```

**Features**:

- Tab-based interface with "Resolve" and "Cancel" tabs
- Resolve tab:
  - YES/NO radio buttons with green/red visual styling
  - Selected outcome highlighted clearly
  - "Resolve Market" button
- Cancel tab:
  - Warning message: "This will cancel the market and refund all bets"
  - Explanation of refund mechanism
  - "Cancel Market" button (red)
- Action buttons disabled if user is not owner
- Loading spinner during transaction creation/signing
- Error display with retry option
- Success message before auto-closing

**Key reactive values**:

```typescript
$: isOwner = walletStore.publicKey === contract.creator;
$: canManage = isOwner && !contract.resolved;
$: activeTab = 'resolve' | 'cancel';
$: selectedOutcome = 'yes' | 'no' | null;
$: isLoading = false;
$: error = null;
$: success = null;
```

**Modal styling**: Dark theme, matches existing design system (colors from `+page.svelte:361-390`)

### 2.2 Management Button Component

**New component**: `src/lib/components/MarketManagementButton.svelte`

**Props**:

```typescript
interface Props {
	contract: Contract;
	isOwner: boolean;
	onClick: () => void;
}
```

**Features**:

- "Manage Market" button (visible to everyone)
- Disabled state:
  - Visual: grayed out, no hover effect
  - Tooltip: "Only the market creator can manage this market"
- Opens modal on click when enabled
- Shows "Resolved" badge if market is already resolved
- Hidden if market is cancelled

**Visual style**:

- Active: Dark background with accent color (#4ade80 green)
- Disabled: Gray background (#374151), reduced opacity
- Consistent with other buttons in `+page.svelte:375-390`

### 2.3 Extend MarketInfo Component

**File**: `src/lib/components/MarketInfo.svelte:1-378`

**Add to props** (around line 6):

```typescript
export let isOwner: boolean = false;
export let onManageClick: () => void = () => {};
```

**Add to UI** (between `resolution-date:278` and `market-details:284`):

```svelte
<!-- Owner Badge & Management -->
{#if contract.status === 'active' && isOwner}
	<div class="owner-badge">
		<span class="badge-icon">👑</span>
		<span>You own this market</span>
	</div>
	<button class="btn-manage" on:click={onManageClick}> Manage Market </button>
{/if}
```

**Add corresponding styles** (in `<style>` section):

```css
.owner-badge {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem;
	background-color: rgba(74, 222, 128, 0.1);
	border: 1px solid rgba(74, 222, 128, 0.3);
	border-radius: 0.375rem;
	margin-bottom: 0.75rem;
	color: #4ade80;
	font-size: 0.875rem;
	font-weight: 600;
}

.btn-manage {
	width: 100%;
	padding: 0.75rem;
	background-color: #4ade80;
	color: #111827;
	border: none;
	border-radius: 0.375rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-manage:hover {
	background-color: #22c55e;
	transform: translateY(-1px);
}
```

---

## Phase 3: Page Integration

### 3.1 Add Owner Detection

**File**: `src/routes/(market)/[slug]/+page.svelte:2-32`

**Add** after imports (around line 14):

```typescript
import { walletStore } from '$lib/stores/wallet.js';
```

**Add** to script section (around line 27, after `$: resolution`):

```typescript
$: isOwner = contract && walletStore.publicKey === contract.creator;
```

### 3.2 Add Modal State Management

**Add** to script section (after line 27):

```typescript
$: showManagementModal = false;

function closeManagementModal() {
	showManagementModal = false;
}

function openManagementModal() {
	showManagementModal = true;
}
```

### 3.3 Add Management Button

**Location**: After `market-status` section in `+page.svelte:77-86`

**Add** (around line 87, after the closing `</div>` of `market-status`):

```svelte
{#if contract.status === 'active'}
	<MarketManagementButton {contract} {isOwner} onClick={openManagementModal} />
{/if}
```

### 3.4 Add Modal to Page

**Add** at bottom of component (before closing `</div>` at line 139):

```svelte
<MarketManagementModal {contract} isOpen={showManagementModal} onClose={closeManagementModal} />
```

**Add import** at top (around line 13):

```typescript
import MarketManagementModal from '$lib/components/MarketManagementModal.svelte';
import MarketManagementButton from '$lib/components/MarketManagementButton.svelte';
```

---

## Phase 4: Transaction Signing Integration

### 4.1 Wallet Signing Helper

**File**: `src/lib/api/contracts.ts` (add new section at end)

**Add function**:

```typescript
export async function signAndSendTransaction(
	transactionBase64: string
): Promise<{ signature: string }> {
	// Import wallet adapter utilities
	const { getProvider, signAndSendTransaction } = await import('@solana/wallet-adapter-react');

	const transaction = Transaction.from(Buffer.from(transactionBase64, 'base64'));

	const { wallet } = getProvider();
	const { publicKey, signTransaction } = wallet.adapter;

	const signedTx = await signTransaction(transaction);
	const signature = await signAndSendTransaction(signedTx);

	return { signature };
}
```

### 4.2 Update Market Management Modal

**Add imports**:

```typescript
import { resolveContract, cancelContract } from '$lib/api/contracts.js';
import { signAndSendTransaction } from '$lib/api/contracts.js';
import { invalidateAll } from '$app/navigation';
```

**Add resolve handler**:

```typescript
async function handleResolve() {
	if (!selectedOutcome) return;

	isLoading = true;
	error = null;

	try {
		// Create transaction
		const { transaction } = await resolveContract({
			contractId: contract.id,
			resolution: selectedOutcome
		});

		// Sign and send
		const { signature } = await signAndSendTransaction(transaction);

		// Show success
		success = `Market resolved as ${selectedOutcome.toUpperCase()}! Tx: ${signature.slice(0, 8)}...`;

		// Refresh data
		await invalidateAll();

		// Close modal after delay
		setTimeout(() => {
			onClose();
			success = null;
		}, 2000);
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to resolve market';
	} finally {
		isLoading = false;
	}
}
```

**Add cancel handler**:

```typescript
async function handleCancel() {
	isLoading = true;
	error = null;

	try {
		// Create transaction
		const { transaction } = await cancelContract({
			contractId: contract.id
		});

		// Sign and send
		const { signature } = await signAndSendTransaction(transaction);

		// Show success
		success = `Market cancelled! All bets refunded. Tx: ${signature.slice(0, 8)}...`;

		// Refresh data
		await invalidateAll();

		// Close modal after delay
		setTimeout(() => {
			onClose();
			success = null;
		}, 2000);
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to cancel market';
	} finally {
		isLoading = false;
	}
}
```

---

## Phase 5: Testing & Validation

### 5.1 Unit Tests

**New file**: `src/lib/components/__tests__/MarketManagementModal.test.ts`

**Test scenarios**:

```typescript
describe('MarketManagementModal', () => {
	it('renders modal when isOpen is true', () => {});
	it('does not render when isOpen is false', () => {});
	it('disables buttons when user is not owner', () => {});
	it('enables buttons when user is owner', () => {});
	it('calls resolveContract with correct params on resolve', () => {});
	it('calls cancelContract on cancel', () => {});
	it('shows loading state during transaction', () => {});
	it('displays error message on failure', () => {});
	it('closes modal after successful resolution', () => {});
});
```

**New file**: `src/lib/components/__tests__/MarketManagementButton.test.ts`

**Test scenarios**:

```typescript
describe('MarketManagementButton', () => {
	it('renders button for active markets', () => {});
	it('does not render for resolved markets', () => {});
	it('disables button for non-owners', () => {});
	it('calls onClick when enabled button is clicked', () => {});
	it('shows tooltip when disabled', () => {});
});
```

### 5.2 Integration Testing

**Manual testing checklist**:

**Non-owner view**:

- [ ] Management button is visible but disabled
- [ ] Tooltip shows "Only the market creator can manage this market"
- [ ] Button cannot be clicked

**Owner view - Resolve**:

- [ ] Management button is enabled
- [ ] Clicking opens modal
- [ ] Resolve tab shows YES/NO options
- [ ] Selecting YES highlights option
- [ ] Clicking "Resolve Market" creates and signs transaction
- [ ] Success message shows after resolution
- [ ] Modal closes and market data refreshes
- [ ] Management button is hidden after resolution

**Owner view - Cancel**:

- [ ] Switching to Cancel tab shows warning
- [ ] Clicking "Cancel Market" creates and signs transaction
- [ ] Success message shows refund confirmation
- [ ] Modal closes and market status updates to 'cancelled'

**Error handling**:

- [ ] Transaction failure shows error message
- [ ] Error message is descriptive
- [ ] Retry button works
- [ ] Modal stays open on error

**Edge cases**:

- [ ] Wallet disconnect hides owner controls
- [ ] Wallet reconnect shows owner controls
- [ ] Market with no bets can still be cancelled
- [ ] Market with many bets can be resolved
- [ ] Mobile view shows modal correctly

### 5.3 Smart Contract Testing

**Run**: `make test` to verify resolve/cancel instructions work correctly with new UI flow

**Key test cases**:

- Owner can resolve market as YES
- Owner can resolve market as NO
- Owner can cancel market
- Non-owner cannot resolve or cancel (constraint enforced by contract)
- Market cannot be resolved twice
- Market cannot be cancelled after resolution
- Bets are correctly distributed to winners on resolution
- Bets are refunded on cancellation

---

## Implementation Order

### Priority 1: Backend Foundation

1. ✅ Rebuild IDL (`make build`)
2. ✅ Create cancel API route (`+server.ts`)
3. ✅ Add cancel client function (`contracts.ts`)

### Priority 2: Core Components

4. ✅ Create `MarketManagementModal.svelte`
5. ✅ Create `MarketManagementButton.svelte`
6. ✅ Extend `MarketInfo.svelte` with owner badge

### Priority 3: Page Integration

7. ✅ Add owner detection to page
8. ✅ Add modal state management
9. ✅ Integrate components into market page

### Priority 4: Transaction Flow

10. ✅ Implement wallet signing helper
11. ✅ Connect modal actions to API
12. ✅ Add success/error handling

### Priority 5: Testing

13. ✅ Write unit tests
14. ✅ Manual integration testing
15. ✅ Run `npm run check` and `npm run lint`
16. ✅ Run `make test` for smart contract

---

## Edge Cases & Considerations

### Security

- ✅ Smart contract enforces ownership at the protocol level
- ✅ UI visibility doesn't affect security - unauthorized transactions will fail on-chain
- ✅ Wallet signing requires user confirmation (no auto-signing)

### Network & State

- ⚠️ Handle transaction failures gracefully
- ⚠️ Show clear error messages for RPC errors, insufficient funds, etc.
- ⚠️ Market data refresh after successful resolution/cancellation (use `invalidateAll()`)
- ⚠️ Handle case where transaction succeeds but state update fails

### UX Considerations

- ⚠️ Modal must be mobile-friendly (full-screen on devices < 768px)
- ⚠️ Keyboard navigation support (Escape to close, Tab to navigate)
- ⚠️ ARIA labels for accessibility
- ⚠️ Loading states should have clear visual feedback
- ⚠️ Success messages should be auto-dismissed or manually dismissible

### Data Consistency

- ⚠️ Race conditions: User clicks resolve multiple times → show loading state immediately
- ⚠️ Stale data: Refresh market data on modal open
- ⚠️ Wallet changes: Recalculate owner status on wallet connect/disconnect

---

## Files Summary

### New Files (2)

1. `src/routes/api/contracts/[id]/cancel/+server.ts` - Cancel API route
2. `src/lib/components/MarketManagementModal.svelte` - Resolution/cancellation modal
3. `src/lib/components/MarketManagementButton.svelte` - Management button
4. `src/lib/components/__tests__/MarketManagementModal.test.ts` - Modal unit tests
5. `src/lib/components/__tests__/MarketManagementButton.test.ts` - Button unit tests

### Modified Files (4)

1. `src/lib/idl/amafcoin.json` - Auto-generated from Anchor build
2. `src/lib/api/contracts.ts` - Add `cancelContract()` and wallet signing helper
3. `src/lib/components/MarketInfo.svelte` - Add owner badge and management button
4. `src/routes/(market)/[slug]/+page.svelte` - Integrate components and state management

### Auto-generated Files (1)

1. `target/idl/amafcoin.json` - Regenerated by Anchor build

---

## Complexity Assessment

**Overall**: Medium complexity

**Rationale**:

- ✅ Existing patterns can be leveraged (resolve route, modal patterns)
- ✅ Smart contract logic is already implemented
- ✅ Clear data flow: API → Wallet → UI
- ⚠️ Transaction signing requires careful error handling
- ⚠️ State synchronization between wallet and UI needs attention
- ✅ Minimal changes to existing components

**Estimated effort**: 4-6 hours of development + 2 hours testing

---

## Success Criteria

- [ ] Owners can resolve markets as YES or NO
- [ ] Owners can cancel markets
- [ ] Non-owners cannot resolve or cancel (enforced at both UI and contract level)
- [ ] Transaction signing works smoothly with wallet
- [ ] Success/error states are clear and informative
- [ ] Market data refreshes after resolution/cancellation
- [ ] All linting checks pass (`npm run lint`)
- [ ] All type checks pass (`npm run check`)
- [ ] Unit tests pass (`npm test`)
- [ ] Smart contract tests pass (`make test`)
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation, ARIA labels)
