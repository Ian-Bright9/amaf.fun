<script lang="ts">
	import { marketsStore } from '$lib/stores/markets.js';
	import { formatCurrency, formatPercentage } from '$lib/utils/format.js';

	const markets = $derived($marketsStore.markets);
	const loading = $derived($marketsStore.loading);
	const error = $derived($marketsStore.error);
</script>

<div class="container">
	<header>
		<h1>AMAF.fun</h1>
		<p>Decentralized Prediction Markets on Solana</p>
	</header>

	<main>
		<section class="hero">
			<h2>Bet on Anything</h2>
			<p>Create and bet on prediction markets using Solana tokens</p>
			<a href="/market/create" class="btn btn-primary">Create Market</a>
		</section>

		<section class="markets">
			<h2>Active Markets</h2>
			{#if loading}
				<p>Loading markets...</p>
			{:else if error}
				<p class="error">{error}</p>
			{:else if markets.length === 0}
				<p>No active markets yet. Be the first to create one!</p>
			{:else}
				<div class="market-list">
					{#each markets as market (market.contract.id)}
						<a href="/market/{market.contract.id}" class="market-card">
							<h3>{market.contract.question}</h3>
							<div class="market-stats">
								<span class="stat">Yes: {formatPercentage(market.yesPrice)}</span>
								<span class="stat">No: {formatPercentage(market.noPrice)}</span>
							</div>
							<div class="market-meta">
								<small>Volume: {formatCurrency(market.volume)}</small>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	</main>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	header h1 {
		font-size: 3rem;
		margin: 0;
		background: linear-gradient(135deg, #4ade80, #22c55e);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	header p {
		color: #9ca3af;
		font-size: 1.25rem;
		margin-top: 0.5rem;
	}

	.hero {
		text-align: center;
		padding: 3rem;
		background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
		border-radius: 0.75rem;
		margin-bottom: 2rem;
	}

	.hero h2 {
		font-size: 2.5rem;
		margin: 0 0 1rem 0;
	}

	.hero p {
		color: #9ca3af;
		font-size: 1.125rem;
		margin-bottom: 2rem;
	}

	.btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.btn-primary {
		background-color: #4ade80;
		color: #000;
	}

	.btn-primary:hover {
		background-color: #22c55e;
		transform: translateY(-2px);
	}

	.markets h2 {
		font-size: 2rem;
		margin-bottom: 1.5rem;
	}

	.market-list {
		display: grid;
		gap: 1rem;
	}

	.market-card {
		display: block;
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
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
	}

	.market-stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.stat {
		padding: 0.25rem 0.75rem;
		background-color: #2d2d2d;
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.market-meta small {
		color: #6b7280;
	}

	.error {
		color: #ef4444;
	}

	:global(formatPercentage) {
		font-size: 0.875rem;
	}
</style>
