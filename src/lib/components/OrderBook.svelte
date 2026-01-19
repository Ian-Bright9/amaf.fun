<script lang="ts">
	import { formatCurrency, formatDate, shortenAddress } from '../utils/format.js';
	import type { Bet } from '../../types/index.js';

	export let bets: Bet[];

	// Sort bets by timestamp (newest first)
	$: sortedBets = bets.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	);

	// Calculate volume for each position
	$: yesVolume = bets
		.filter((bet) => bet.position === 'yes')
		.reduce((sum, bet) => sum + bet.amount, 0);
	$: noVolume = bets
		.filter((bet) => bet.position === 'no')
		.reduce((sum, bet) => sum + bet.amount, 0);
	$: totalVolume = yesVolume + noVolume;
</script>

<div class="order-book">
	<h3>Recent Activity</h3>

	<!-- Volume Summary -->
	<div class="volume-summary">
		<div class="volume-item yes">
			<span class="volume-label">YES Volume</span>
			<span class="volume-amount">{formatCurrency(yesVolume)}</span>
		</div>
		<div class="volume-item no">
			<span class="volume-label">NO Volume</span>
			<span class="volume-amount">{formatCurrency(noVolume)}</span>
		</div>
		<div class="volume-item total">
			<span class="volume-label">Total</span>
			<span class="volume-amount">{formatCurrency(totalVolume)}</span>
		</div>
	</div>

	<!-- Bets List -->
	<div class="bets-list">
		{#if sortedBets.length === 0}
			<div class="no-bets">
				<p>No bets placed yet</p>
			</div>
		{:else}
			{#each sortedBets as bet (bet.id)}
				<div class="bet-item">
					<div class="bet-header">
						<div class="bet-position {bet.position}">
							{bet.position.toUpperCase()}
						</div>
						<div class="bet-amount">{formatCurrency(bet.amount)}</div>
					</div>
					<div class="bet-details">
						<div class="bet-user">
							<span class="user-label">User:</span>
							<span class="user-address">{shortenAddress(bet.user)}</span>
						</div>
						<div class="bet-time">{formatDate(bet.timestamp)}</div>
					</div>
					<div class="bet-odds">
						Odds: {(1 / bet.odds).toFixed(2)}x
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.order-book {
		background-color: #1f2937;
		padding: 1.5rem;
		border-radius: 0.5rem;
	}

	.order-book h3 {
		color: #f9fafb;
		margin-bottom: 1rem;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.volume-summary {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.volume-item {
		flex: 1;
		padding: 0.75rem;
		border-radius: 0.375rem;
		text-align: center;
	}

	.volume-item.yes {
		background-color: rgba(16, 185, 129, 0.1);
		border: 1px solid #10b981;
	}

	.volume-item.no {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
	}

	.volume-item.total {
		background-color: #374151;
	}

	.volume-label {
		display: block;
		font-size: 0.75rem;
		color: #9ca3af;
		margin-bottom: 0.25rem;
	}

	.volume-amount {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: #f9fafb;
	}

	.bets-list {
		max-height: 400px;
		overflow-y: auto;
	}

	.no-bets {
		text-align: center;
		padding: 2rem 1rem;
		color: #6b7280;
	}

	.bet-item {
		background-color: #374151;
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 0.75rem;
	}

	.bet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.bet-position {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.bet-position.yes {
		background-color: #10b981;
		color: white;
	}

	.bet-position.no {
		background-color: #ef4444;
		color: white;
	}

	.bet-amount {
		font-weight: 600;
		color: #f9fafb;
	}

	.bet-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.bet-user {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.user-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.user-address {
		font-size: 0.75rem;
		color: #d1d5db;
		font-family: monospace;
	}

	.bet-time {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.bet-odds {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: right;
	}

	/* Scrollbar styling */
	.bets-list::-webkit-scrollbar {
		width: 6px;
	}

	.bets-list::-webkit-scrollbar-track {
		background: #374151;
		border-radius: 3px;
	}

	.bets-list::-webkit-scrollbar-thumb {
		background: #6b7280;
		border-radius: 3px;
	}

	.bets-list::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
