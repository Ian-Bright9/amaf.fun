<script lang="ts">
	import { marketsStore } from '$lib/stores/markets.js';
	import { formatCurrency, formatPercentage, formatDate } from '$lib/utils/format.js';
	import { onMount } from 'svelte';

	let { data }: { data: { markets: any[]; error: string | null } } = $props();

	// Initialize store with server data
	onMount(() => {
		if (data.markets && data.markets.length > 0) {
			marketsStore.setMarkets(data.markets);
		}
	});

	const markets = $derived($marketsStore.markets);
	const loading = $derived($marketsStore.loading);
	const error = $derived($marketsStore.error);

	let activeTab = $state<'trending' | 'new' | 'all'>('trending');

	function setTab(tab: 'trending' | 'new' | 'all') {
		activeTab = tab;
	}
</script>

<div class="container">
	<header class="hero">
		<div class="hero-content">
			<h1>Bet on the Future</h1>
			<p>Decentralized prediction markets powered by Solana</p>
			<a href="/market/create" class="btn btn-primary">Create Market</a>
		</div>
	</header>

	<main>
		<section class="markets-section">
			<div class="tabs">
				<button
					class="tab {activeTab === 'trending' ? 'active' : ''}"
					onclick={() => setTab('trending')}
				>
					Trending
				</button>
				<button class="tab {activeTab === 'new' ? 'active' : ''}" onclick={() => setTab('new')}>
					New
				</button>
				<button class="tab {activeTab === 'all' ? 'active' : ''}" onclick={() => setTab('all')}>
					All
				</button>
			</div>

			{#if loading}
				<div class="skeleton-grid">
					{#each Array(6) as _}
						<div class="skeleton-card">
							<div class="skeleton-text skeleton-title"></div>
							<div class="skeleton-stats">
								<div class="skeleton-bar"></div>
								<div class="skeleton-bar"></div>
							</div>
							<div class="skeleton-text skeleton-meta"></div>
						</div>
					{/each}
				</div>
			{:else if error}
				<div class="error-state">
					<div class="error-icon">⚠️</div>
					<h3>Error Loading Markets</h3>
					<p>{error}</p>
					<button class="btn btn-secondary" onclick={() => window.location.reload()}>
						Try Again
					</button>
				</div>
			{:else if markets.length === 0}
				<div class="empty-state">
					<div class="empty-icon">🎯</div>
					<h3>No Markets Yet</h3>
					<p>Be the first to create a prediction market!</p>
					<a href="/market/create" class="btn btn-primary">Create Market</a>
				</div>
			{:else}
				<div class="market-grid">
					{#each markets as market (market.contract.id)}
						<a href="/market/{market.contract.id}" class="market-card">
							<div class="card-header">
								<span class="status-badge status-{market.contract.status}">
									{market.contract.status}
								</span>
								<span class="volume">{formatCurrency(market.volume)}</span>
							</div>
							<h3>{market.contract.question}</h3>
							<p class="description">{market.contract.description || 'No description'}</p>
							<div class="price-section">
								<div class="price-bar">
									<div class="bar yes-bar" style="width: {market.yesPrice * 100}%"></div>
									<div class="bar no-bar" style="width: {market.noPrice * 100}%"></div>
								</div>
								<div class="price-labels">
									<span class="yes-label">
										<strong>{formatPercentage(market.yesPrice)}</strong> Yes
									</span>
									<span class="no-label">
										<strong>{formatPercentage(market.noPrice)}</strong> No
									</span>
								</div>
							</div>
							<div class="card-footer">
								<span class="created">
									Created {formatDate(market.contract.createdAt)}
								</span>
								{#if market.contract.resolvesAt}
									<span class="resolves">
										Resolves {formatDate(market.contract.resolvesAt)}
									</span>
								{/if}
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
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.hero {
		padding: 4rem 0;
		text-align: center;
		background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
		border-bottom: 1px solid #2d2d2d;
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.hero h1 {
		font-size: 3.5rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, #b80841 0%, #9e0738 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.02em;
	}

	.hero p {
		font-size: 1.25rem;
		color: #9ca3af;
		margin: 0 0 2rem 0;
		line-height: 1.6;
	}

	.btn {
		display: inline-block;
		padding: 0.875rem 2rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		transition: all 0.2s ease;
		border: none;
		cursor: pointer;
		letter-spacing: 0.025em;
	}

	.btn-primary {
		background-color: #b80841;
		color: #000;
	}

	.btn-primary:hover {
		background-color: #9e0738;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(184, 8, 65, 0.3);
	}

	.btn-secondary {
		background-color: #2d2d2d;
		color: #fff;
		border: 1px solid #3d3d3d;
	}

	.btn-secondary:hover {
		background-color: #3d3d3d;
		transform: translateY(-2px);
	}

	.markets-section {
		padding: 2rem 0;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid #2d2d2d;
		padding-bottom: 0;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: none;
		color: #9ca3af;
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border-bottom: 2px solid transparent;
	}

	.tab:hover {
		color: #fff;
	}

	.tab.active {
		color: #b80841;
		border-bottom-color: #b80841;
		font-weight: 600;
	}

	.skeleton-grid,
	.market-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.skeleton-card {
		padding: 1.5rem;
		background-color: #1a1a1a;
		border: 1px solid #2d2d2d;
		border-radius: 0.5rem;
		opacity: 0.6;
	}

	.skeleton-text {
		height: 1.5rem;
		background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.25rem;
		margin-bottom: 1rem;
	}

	.skeleton-title {
		height: 1.75rem;
	}

	.skeleton-meta {
		height: 1rem;
		width: 60%;
	}

	.skeleton-stats {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.skeleton-bar {
		flex: 1;
		height: 0.5rem;
		background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.125rem;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.error-state,
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background-color: #1a1a1a;
		border: 1px solid #2d2d2d;
		border-radius: 0.75rem;
	}

	.error-icon,
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}

	.error-state h3,
	.empty-state h3 {
		font-size: 1.5rem;
		margin: 0 0 0.75rem 0;
	}

	.error-state p,
	.empty-state p {
		color: #9ca3af;
		margin: 0 0 2rem 0;
		line-height: 1.6;
	}

	.market-card {
		display: block;
		padding: 1.5rem;
		background-color: #1a1a1a;
		border: 1px solid #2d2d2d;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}

	.market-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, #b80841, transparent);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.market-card:hover {
		border-color: #b80841;
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.market-card:hover::before {
		opacity: 1;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-active {
		background-color: rgba(9, 194, 133, 0.15);
		color: #09c285;
	}

	.status-resolved {
		background-color: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.status-cancelled {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.volume {
		font-size: 0.8125rem;
		color: #6b7280;
		font-weight: 500;
	}

	.market-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.description {
		color: #9ca3af;
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.price-section {
		margin-bottom: 1rem;
	}

	.price-bar {
		display: flex;
		height: 0.5rem;
		background-color: #2d2d2d;
		border-radius: 0.25rem;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.yes-bar {
		background-color: #09c285;
		transition: width 0.3s ease;
	}

	.no-bar {
		background-color: #ef4444;
		transition: width 0.3s ease;
	}

	.price-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
	}

	.yes-label {
		color: #09c285;
	}

	.no-label {
		color: #ef4444;
		text-align: right;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #2d2d2d;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.created,
	.resolves {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2.5rem;
		}

		.hero p {
			font-size: 1rem;
		}

		.skeleton-grid,
		.market-grid {
			grid-template-columns: 1fr;
		}

		.tabs {
			overflow-x: auto;
			padding-bottom: 0;
		}
	}
</style>
