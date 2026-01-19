<script lang="ts">
	import { marketsStore } from '$lib/stores/markets.js';
	import { formatCurrency, formatPercentage, formatDate } from '$lib/utils/format.js';
	import { onMount } from 'svelte';
	import type { MarketData } from '../../types/index.js';

	let { data }: { data: { markets: MarketData[]; error: string | null } } = $props();

	// Initialize store with server data
	onMount(() => {
		if (data.markets && data.markets.length > 0) {
			marketsStore.setMarkets(data.markets);
		}
	});

	let activeTab = $state<'trending' | 'new' | 'all'>('trending');

	const markets = $derived($marketsStore.markets);
	const loading = $derived($marketsStore.loading);
	const error = $derived($marketsStore.error);

	function setTab(tab: 'trending' | 'new' | 'all') {
		activeTab = tab;
	}

	function formatTimeLeft(resolvesAt: string): string {
		const now = new Date();
		const resolve = new Date(resolvesAt);
		const diff = resolve.getTime() - now.getTime();

		if (diff < 0) return 'Resolved';
		if (diff < 24 * 60 * 60 * 1000) {
			const hours = Math.floor(diff / (60 * 60 * 1000));
			return `${hours}h left`;
		}
		if (diff < 7 * 24 * 60 * 60 * 1000) {
			const days = Math.floor(diff / (24 * 60 * 60 * 1000));
			return `${days}d left`;
		}
		return formatDate(resolvesAt);
	}

	function getTrend(market: MarketData): 'up' | 'down' | 'neutral' {
		const change = (market.contract.currentYesPrice || 0) - (market.contract.yesPrice || 0);
		if (change > 0.01) return 'up';
		if (change < -0.01) return 'down';
		return 'neutral';
	}
</script>

<div class="container">
	<div class="page-header">
		<h1>Prediction Markets</h1>
		<a href="/market/create" class="create-btn">
			<svg
				width="18"
				height="18"
				viewBox="0 0 18 18"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M9 4.5V13.5M4.5 9H13.5"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
			Create Market
		</a>
	</div>

	<div class="tabs">
		<button class="tab" class:active={activeTab === 'trending'} onclick={() => setTab('trending')}>
			Trending
		</button>
		<button class="tab" class:active={activeTab === 'new'} onclick={() => setTab('new')}>
			New
		</button>
		<button class="tab" class:active={activeTab === 'all'} onclick={() => setTab('all')}>
			All
		</button>
	</div>

	{#if loading}
		<div class="loading-grid">
			{#each Array(6) as _}
				<div class="skeleton-card">
					<div class="skeleton-header">
						<div class="skeleton-badge"></div>
						<div class="skeleton-title"></div>
					</div>
					<div class="skeleton-stats">
						<div class="skeleton-bar"></div>
						<div class="skeleton-bar"></div>
					</div>
					<div class="skeleton-footer"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h3>Error Loading Markets</h3>
			<p>{error}</p>
			<button class="retry-btn" onclick={() => window.location.reload()}> Try Again </button>
		</div>
	{:else if markets.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🎯</div>
			<h3>No Markets Yet</h3>
			<p>Be the first to create a prediction market!</p>
			<a href="/market/create" class="create-btn primary">
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9 4.5V13.5M4.5 9H13.5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				Create Market
			</a>
		</div>
	{:else}
		<div class="market-grid">
			{#each markets as market (market.contract.id)}
				<a href="/market/{market.contract.id}" class="market-card">
					<div class="card-header">
						<span class="status-badge status-{market.contract.status}">
							{market.contract.status}
						</span>
						<span class="time-left">{formatTimeLeft(market.contract.resolvesAt)}</span>
					</div>

					<h3 class="card-title">{market.contract.question}</h3>

					{#if market.contract.description}
						<p class="card-description">{market.contract.description}</p>
					{/if}

					<div class="price-section">
						<div class="price-bar">
							<div class="bar-fill yes" style="width: {market.yesPrice * 100}%"></div>
							<div class="bar-fill no" style="width: {market.noPrice * 100}%"></div>
						</div>
						<div class="price-labels">
							<span class="yes-price">
								<strong>{formatPercentage(market.yesPrice)}</strong>
								<span class="trend trend-{getTrend(market)}">
									{#if getTrend(market) === 'up'}
										↑
									{:else if getTrend(market) === 'down'}
										↓
									{/if}
								</span>
							</span>
							<span class="no-price">
								<strong>{formatPercentage(market.noPrice)}</strong>
							</span>
						</div>
					</div>

					<div class="card-footer">
						<span class="volume">
							<svg
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M7 1.5V12.5M3.5 4.5L10.5 9.5M10.5 4.5L3.5 9.5"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
							{formatCurrency(market.volume)}
						</span>
						<span class="bets">{market.contract.betCount || 0} bets</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1.5rem 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 0;
		gap: 1rem;
	}

	.page-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
	}

	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: #2d2d2d;
		color: #fff;
		border: 1px solid #3d3d3d;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.create-btn:hover {
		background-color: #3d3d3d;
		border-color: #4d4d4d;
	}

	.create-btn.primary {
		background-color: #b80841;
		border-color: #b80841;
	}

	.create-btn.primary:hover {
		background-color: #9e0738;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #2d2d2d;
		padding-bottom: 0;
	}

	.tab {
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		color: #9ca3af;
		font-weight: 500;
		font-size: 0.875rem;
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

	.loading-grid,
	.market-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1.25rem;
	}

	.skeleton-card {
		padding: 1.5rem;
		background-color: #1a1a1a;
		border: 1px solid #2d2d2d;
		border-radius: 0.75rem;
		opacity: 0.6;
	}

	.skeleton-header {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.skeleton-badge {
		width: 60px;
		height: 24px;
		background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.25rem;
	}

	.skeleton-title {
		flex: 1;
		height: 32px;
		background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.25rem;
	}

	.skeleton-stats {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.skeleton-bar {
		flex: 1;
		height: 40px;
		background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.25rem;
	}

	.skeleton-footer {
		height: 20px;
		background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.25rem;
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
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-state h3,
	.empty-state h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
	}

	.error-state p,
	.empty-state p {
		color: #9ca3af;
		margin: 0 0 2rem 0;
	}

	.retry-btn {
		padding: 0.75rem 1.5rem;
		background-color: #2d2d2d;
		color: #fff;
		border: 1px solid #3d3d3d;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.retry-btn:hover {
		background-color: #3d3d3d;
	}

	.error-state p,
	.empty-state p {
		color: #9ca3af;
		margin: 0 0 2rem 0;
	}

	.retry-btn {
		padding: 0.75rem 1.5rem;
		background-color: #2d2d2d;
		color: #fff;
		border: 1px solid #3d3d3d;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.retry-btn:hover {
		background-color: #3d3d3d;
	}

	.market-card {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		background-color: #1a1a1a;
		border: 1px solid #2d2d2d;
		border-radius: 0.75rem;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.market-card:hover {
		border-color: #b80841;
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(184, 8, 65, 0.15);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-active {
		background-color: rgba(184, 8, 65, 0.15);
		color: #b80841;
	}

	.status-resolved {
		background-color: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.status-cancelled {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.time-left {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.card-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #fff;
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-description {
		font-size: 0.875rem;
		color: #9ca3af;
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
		height: 6px;
		background-color: #2d2d2d;
		border-radius: 0.375rem;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.bar-fill.yes {
		background-color: #b80841;
		transition: width 0.3s ease;
	}

	.bar-fill.no {
		background-color: #ef4444;
		transition: width 0.3s ease;
	}

	.price-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
	}

	.yes-price {
		color: #b80841;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.no-price {
		color: #ef4444;
		text-align: right;
	}

	.trend {
		font-size: 0.75rem;
	}

	.trend-up {
		color: #10b981;
	}

	.trend-down {
		color: #ef4444;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #2d2d2d;
		margin-top: auto;
	}

	.volume {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.bets {
		font-size: 0.75rem;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.page-header h1 {
			font-size: 1.5rem;
		}

		.loading-grid,
		.market-grid {
			grid-template-columns: 1fr;
		}

		.tabs {
			overflow-x: auto;
		}
	}
</style>
