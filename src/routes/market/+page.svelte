<script lang="ts">
	import { marketsStore } from '$lib/stores/markets.js';
	import { formatCurrency, formatPercentage } from '$lib/utils/format.js';
</script>

<h1>All Markets</h1>

<div class="markets">
	{#if $marketsStore.loading}
		<p>Loading markets...</p>
	{:else if $marketsStore.error}
		<p class="error">{$marketsStore.error}</p>
	{:else if $marketsStore.markets.length === 0}
		<p>No markets yet. <a href="/market/create">Create one!</a></p>
	{:else}
		<div class="market-list">
			{#each $marketsStore.markets as market (market.contract.id)}
				<a href="/market/{market.contract.id}" class="market-card">
					<h3>{market.contract.question}</h3>
					<div class="market-status status-{market.contract.status}">
						{market.contract.status}
					</div>
					<div class="market-stats">
						<span class="stat">Yes: {formatPercentage(market.yesPrice)}</span>
						<span class="stat">No: {formatPercentage(market.noPrice)}</span>
					</div>
					<div class="market-meta">
						<small>Created: {market.contract.createdAt}</small>
						<small>Volume: {formatCurrency(market.volume)}</small>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.markets {
		max-width: 800px;
		margin: 0 auto;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1.5rem;
	}

	.market-list {
		display: grid;
		gap: 1rem;
	}

	.market-card {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 1.5rem;
		background-color: #1a1a1a;
		border: 1px solid #333;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.market-card:hover {
		border-color: #4ade80;
		transform: translateY(-2px);
	}

	.market-card h3 {
		margin: 0;
		font-size: 1.125rem;
	}

	.market-status {
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-active {
		background-color: rgba(74, 222, 128, 0.2);
		color: #4ade80;
	}

	.status-resolved {
		background-color: rgba(59, 130, 246, 0.2);
		color: #3b82f6;
	}

	.status-cancelled {
		background-color: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.market-stats {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.stat {
		padding: 0.25rem 0.75rem;
		background-color: #2d2d2d;
		border-radius: 0.25rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.market-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		grid-column: 1 / -1;
	}

	.market-meta small {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.error {
		color: #ef4444;
	}
</style>
