<script lang="ts">
	import { marketsStore } from '$lib/stores/markets.js';
	import { onMount } from 'svelte';
	import type { MarketData } from '../../types/index.js';
	import MarketCard from '$lib/components/MarketCard.svelte';

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
</script>

<div class="container">
	<nav class="breadcrumbs">
		<a href="/" class="breadcrumb-item">Home</a>
		<span class="separator">/</span>
		<a href="/market" class="breadcrumb-item current">Markets</a>
	</nav>
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
				<MarketCard {market} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.container {
		width: 100%;
		max-width: 1800px;
		margin: 0 auto;
		padding: 0 2rem 4rem;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--border-color);
		font-size: 0.875rem;
		margin-bottom: 2rem;
	}

	.breadcrumb-item {
		color: var(--text-secondary);
		text-decoration: none;
		padding: 0.5rem 0.75rem;
		border-radius: var(--border-radius-md);
		transition: all 0.2s ease;
	}

	.breadcrumb-item:hover {
		color: var(--text-primary);
		background-color: var(--bg-hover);
		transform: translateY(-1px);
	}

	.breadcrumb-item.current {
		color: var(--text-primary);
		font-weight: 600;
		pointer-events: none;
	}

	.separator {
		color: var(--text-muted);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 0 2rem 0;
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
		padding: 0.75rem 1.5rem;
		background-color: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.create-btn:hover {
		background-color: var(--bg-hover);
		border-color: var(--border-light);
		transform: translateY(-2px) scale(1.02);
		box-shadow: 0 4px 16px rgba(184, 8, 65, 0.3);
	}

	.create-btn.primary {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--text-dark);
	}

	.create-btn.primary:hover {
		background-color: var(--color-primary-hover);
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
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 1.5rem;
	}

	@media (min-width: 1400px) {
		.market-grid {
			grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		}
	}

	@media (min-width: 1920px) {
		.market-grid {
			grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		}
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
		background-color: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
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
		padding: 0.75rem 2rem;
		background-color: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.retry-btn:hover {
		background-color: var(--bg-hover);
		border-color: var(--border-light);
		transform: translateY(-2px) scale(1.02);
		box-shadow: 0 4px 16px rgba(184, 8, 65, 0.3);
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
