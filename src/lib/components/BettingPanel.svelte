<script lang="ts">
	import { formatCurrency } from '../utils/format.js';
	import { walletStore } from '../stores/wallet.js';
	import type { Contract } from '../../types/index.js';

	export let contract: Contract;

	let amount: number = 10;
	let selectedPosition: 'yes' | 'no' = 'yes';
	let isPlacingBet = false;
	let betError: string | null = null;

	$: canPlaceBet = amount > 0 && $walletStore.connected && !isPlacingBet;
	$: potentialReturn =
		selectedPosition === 'yes' ? amount / contract.yesPrice : amount / contract.noPrice;

	async function placeBet() {
		if (!canPlaceBet) return;

		isPlacingBet = true;
		betError = null;

		try {
			// Mock bet placement - in real app, this would call Solana program
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Success feedback
			console.log(`Placed ${amount} SOL bet on ${selectedPosition} for contract ${contract.id}`);
			amount = 10; // Reset amount
		} catch (error) {
			betError = error instanceof Error ? error.message : 'Failed to place bet';
		} finally {
			isPlacingBet = false;
		}
	}

	function quickSetAmount(value: number) {
		amount = value;
	}
</script>

<div class="betting-panel">
	<h3>Place Bet</h3>

	{#if !$walletStore.connected}
		<div class="connect-wallet-prompt">
			<p>Connect your wallet to place bets</p>
			<button class="btn btn-primary" onclick={() => walletStore.connect()}>
				Connect Wallet
			</button>
		</div>
	{:else}
		<!-- Position Selection -->
		<div class="position-selector">
			<button
				class="position-btn yes"
				class:selected={selectedPosition === 'yes'}
				onclick={() => (selectedPosition = 'yes')}
			>
				<div class="position-label">YES</div>
				<div class="position-odds">{(1 / contract.yesPrice).toFixed(2)}x</div>
				<div class="position-probability">{(contract.yesPrice * 100).toFixed(1)}%</div>
			</button>
			<button
				class="position-btn no"
				class:selected={selectedPosition === 'no'}
				onclick={() => (selectedPosition = 'no')}
			>
				<div class="position-label">NO</div>
				<div class="position-odds">{(1 / contract.noPrice).toFixed(2)}x</div>
				<div class="position-probability">{(contract.noPrice * 100).toFixed(1)}%</div>
			</button>
		</div>

		<!-- Amount Input -->
		<div class="amount-section">
			<label>Bet Amount</label>
			<div class="amount-input-group">
				<input
					type="number"
					bind:value={amount}
					min="1"
					step="1"
					placeholder="0"
					class="amount-input"
				/>
				<span class="amount-currency">SOL</span>
			</div>
			<div class="quick-amounts">
				{#each [10, 25, 50, 100] as value}
					<button class="quick-amount-btn" onclick={() => quickSetAmount(value)}>
						{value}
					</button>
				{/each}
			</div>
		</div>

		<!-- Bet Summary -->
		<div class="bet-summary">
			<div class="summary-row">
				<span>Position:</span>
				<span class="position-highlight {selectedPosition}">
					{selectedPosition.toUpperCase()}
				</span>
			</div>
			<div class="summary-row">
				<span>Bet Amount:</span>
				<span>{formatCurrency(amount)}</span>
			</div>
			<div class="summary-row potential-return">
				<span>Potential Return:</span>
				<span>{formatCurrency(potentialReturn)}</span>
			</div>
		</div>

		<!-- Error Display -->
		{#if betError}
			<div class="error-message">
				{betError}
			</div>
		{/if}

		<!-- Place Bet Button -->
		<button
			class="btn-place-bet"
			class:disabled={!canPlaceBet}
			onclick={placeBet}
			disabled={!canPlaceBet}
		>
			{#if isPlacingBet}
				Placing Bet...
			{:else}
				Place Bet
			{/if}
		</button>
	{/if}
</div>

<style>
	.betting-panel {
		background-color: #1f2937;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 2rem;
	}

	.betting-panel h3 {
		color: #f9fafb;
		margin-bottom: 1.5rem;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.connect-wallet-prompt {
		text-align: center;
		padding: 2rem 1rem;
	}

	.connect-wallet-prompt p {
		color: #9ca3af;
		margin-bottom: 1rem;
	}

	.position-selector {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.position-btn {
		padding: 1rem;
		border: 2px solid transparent;
		border-radius: 0.5rem;
		background-color: #374151;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.position-btn:hover {
		background-color: #4b5563;
	}

	.position-btn.selected {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.position-btn.yes {
		border-color: #10b981;
	}

	.position-btn.yes.selected {
		background-color: rgba(16, 185, 129, 0.2);
		border-color: #10b981;
	}

	.position-btn.no {
		border-color: #ef4444;
	}

	.position-btn.no.selected {
		background-color: rgba(239, 68, 68, 0.2);
		border-color: #ef4444;
	}

	.position-label {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.position-btn.yes .position-label {
		color: #10b981;
	}

	.position-btn.no .position-label {
		color: #ef4444;
	}

	.position-odds {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-bottom: 0.25rem;
	}

	.position-probability {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.amount-section {
		margin-bottom: 1.5rem;
	}

	.amount-section label {
		display: block;
		color: #f9fafb;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.amount-input-group {
		display: flex;
		align-items: center;
		background-color: #374151;
		border: 1px solid #4b5563;
		border-radius: 0.375rem;
		margin-bottom: 0.75rem;
	}

	.amount-input {
		flex: 1;
		background: none;
		border: none;
		padding: 0.75rem;
		color: #f9fafb;
		font-size: 1rem;
		outline: none;
	}

	.amount-input:focus {
		box-shadow: inset 0 0 0 2px #4ade80;
	}

	.amount-currency {
		padding: 0.75rem;
		color: #9ca3af;
		font-weight: 500;
	}

	.quick-amounts {
		display: flex;
		gap: 0.5rem;
	}

	.quick-amount-btn {
		flex: 1;
		padding: 0.5rem;
		background-color: #374151;
		border: 1px solid #4b5563;
		border-radius: 0.25rem;
		color: #f9fafb;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.quick-amount-btn:hover {
		background-color: #4b5563;
		border-color: #6b7280;
	}

	.bet-summary {
		background-color: #374151;
		padding: 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		color: #d1d5db;
	}

	.summary-row:last-child {
		margin-bottom: 0;
	}

	.position-highlight {
		font-weight: 600;
	}

	.position-highlight.yes {
		color: #10b981;
	}

	.position-highlight.no {
		color: #ef4444;
	}

	.potential-return {
		color: #4ade80;
		font-weight: 600;
	}

	.error-message {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		color: #ef4444;
		padding: 0.75rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.btn-place-bet {
		width: 100%;
		padding: 1rem;
		background-color: #4ade80;
		color: #111827;
		border: none;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-place-bet:hover:not(.disabled) {
		background-color: #22c55e;
		transform: translateY(-1px);
	}

	.btn-place-bet.disabled {
		background-color: #374151;
		color: #6b7280;
		cursor: not-allowed;
		transform: none;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-primary {
		background-color: #4ade80;
		color: #111827;
	}

	.btn-primary:hover {
		background-color: #22c55e;
	}
</style>
