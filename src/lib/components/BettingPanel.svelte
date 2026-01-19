<script lang="ts">
	import { formatAmafCurrency } from '../utils/format.js';
	import { walletStore } from '../stores/wallet.js';
	import type { Contract } from '../../types/index.js';

	export let contract: Contract;

	let amount: number = 10;
	let selectedPosition: 'yes' | 'no' = 'yes';
	let isPlacingBet = false;
	let betError: string | null = null;

	$: maxBetAmount = $walletStore.amafBalance > 0 ? $walletStore.amafBalance : 500;
	$: quickAmounts = [10, 25, 50, 100, 250].filter((value) => value <= maxBetAmount);

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
			console.log(`Placed ${amount} ¤ bet on ${selectedPosition} for contract ${contract.id}`);
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
			<div class="amount-label-row">
				<label for="bet-amount">Bet Amount</label>
				<span class="amount-display">{formatAmafCurrency(amount)}</span>
			</div>
			<input
				id="bet-amount"
				type="range"
				bind:value={amount}
				min="1"
				max={maxBetAmount}
				step="1"
				class="amount-slider"
			/>
			<div class="slider-markers">
				<span>1</span>
				<span>{maxBetAmount / 2}</span>
				<span>{maxBetAmount}</span>
			</div>
			<div class="quick-amounts">
				{#each quickAmounts as value}
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
				<span>{formatAmafCurrency(amount)}</span>
			</div>
			<div class="summary-row potential-return">
				<span>Potential Return:</span>
				<span>{formatAmafCurrency(potentialReturn)}</span>
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
		background-color: #181926;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 2rem;
	}

	.betting-panel h3 {
		color: #cad3f5;
		margin-bottom: 1.5rem;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.connect-wallet-prompt {
		text-align: center;
		padding: 2rem 1rem;
	}

	.connect-wallet-prompt p {
		color: #a5adcb;
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
		background-color: #363a4f;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.position-btn:hover {
		background-color: #494d64;
	}

	.position-btn.selected {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.position-btn.yes {
		border-color: #a6da95;
	}

	.position-btn.yes.selected {
		background-color: rgba(166, 218, 149, 0.2);
		border-color: #a6da95;
	}

	.position-btn.no {
		border-color: #ed8796;
	}

	.position-btn.no.selected {
		background-color: rgba(237, 135, 150, 0.2);
		border-color: #ed8796;
	}

	.position-label {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.position-btn.yes .position-label {
		color: #a6da95;
	}

	.position-btn.no .position-label {
		color: #ed8796;
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

	.amount-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.amount-section label {
		color: #cad3f5;
		font-weight: 500;
	}

	.amount-display {
		font-size: 1.125rem;
		font-weight: 600;
		color: #a6da95;
	}

	.amount-slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: #363a4f;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
		margin-bottom: 0.5rem;
	}

	.amount-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #c6a0f6;
		cursor: pointer;
		transition: all 0.2s;
	}

	.amount-slider::-webkit-slider-thumb:hover {
		background: #b58fd5;
		transform: scale(1.1);
	}

	.amount-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #c6a0f6;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.amount-slider::-moz-range-thumb:hover {
		background: #b58fd5;
		transform: scale(1.1);
	}

	.slider-markers {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
		color: #6e738d;
		font-size: 0.75rem;
	}

	.quick-amounts {
		display: flex;
		gap: 0.5rem;
	}

	.quick-amount-btn {
		flex: 1;
		padding: 0.5rem;
		background-color: #363a4f;
		border: 1px solid #494d64;
		border-radius: 0.25rem;
		color: #cad3f5;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.quick-amount-btn:hover {
		background-color: #494d64;
		border-color: #6e738d;
	}

	.bet-summary {
		background-color: #363a4f;
		padding: 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		color: #b8c0e0;
	}

	.summary-row:last-child {
		margin-bottom: 0;
	}

	.position-highlight {
		font-weight: 600;
	}

	.position-highlight.yes {
		color: #a6da95;
	}

	.position-highlight.no {
		color: #ed8796;
	}

	.potential-return {
		color: #a6da95;
		font-weight: 600;
	}

	.error-message {
		background-color: rgba(237, 135, 150, 0.1);
		border: 1px solid #ed8796;
		color: #ed8796;
		padding: 0.75rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.btn-place-bet {
		width: 100%;
		padding: 1rem;
		background-color: #c6a0f6;
		color: #24273a;
		border: none;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-place-bet:hover:not(.disabled) {
		background-color: #b58fd5;
		transform: translateY(-1px);
	}

	.btn-place-bet.disabled {
		background-color: #363a4f;
		color: #6e738d;
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
		background-color: #c6a0f6;
		color: #24273a;
	}

	.btn-primary:hover {
		background-color: #b58fd5;
	}
</style>
