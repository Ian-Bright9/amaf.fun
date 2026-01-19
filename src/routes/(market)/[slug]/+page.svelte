<script lang="ts">
	import { page } from '$app/stores';
	import {
		formatCurrency,
		formatPercentage,
		formatDate,
		shortenAddress
	} from '../../../lib/utils/format.js';
	import { marketsStore } from '../../../lib/stores/markets.js';
	import BettingPanel from '../../../lib/components/BettingPanel.svelte';
	import ApexMarketChart from '../../../lib/components/ApexMarketChart.svelte';
	import OrderBook from '../../../lib/components/OrderBook.svelte';
	import MarketStats from '../../../lib/components/MarketStats.svelte';
	import type { Contract, Bet } from '../../../types/index.js';

	export let data;
	$: contract = data.contract;
	$: bets = data.bets;
	$: error = data.error;

	// Calculate derived values
	$: yesProbability = contract ? contract.yesPrice : 0;
	$: noProbability = contract ? contract.noPrice : 0;
	$: totalVolume = contract ? contract.totalVolume : 0;
	$: isResolved = contract ? contract.status === 'resolved' : false;
	$: resolution = contract ? contract.resolution : null;

	// Breadcrumb navigation
	$: breadcrumbs = [
		{ label: 'Markets', href: '/market' },
		{ label: contract?.question || 'Market', href: `/market/${$page.params.slug}` }
	];
</script>

{#if error}
	<div class="container">
		<nav class="breadcrumbs">
			<a href="/" class="breadcrumb-item">Home</a>
			<span class="separator">/</span>
			<a href="/market" class="breadcrumb-item">Markets</a>
		</nav>
		<div class="error-state">
			<h1>Market Not Found</h1>
			<p>{error}</p>
			<a href="/market" class="btn btn-primary">← Back to Markets</a>
		</div>
	</div>
{:else if contract}
	<div class="container">
		<!-- Breadcrumb Navigation -->
		<nav class="breadcrumbs">
			<a href="/" class="breadcrumb-item">Home</a>
			<span class="separator">/</span>
			<a href="/market" class="breadcrumb-item">Markets</a>
			<span class="separator">/</span>
			<span class="breadcrumb-item current">{contract?.question || 'Market'}</span>
		</nav>
		<nav class="breadcrumb">
			{#each breadcrumbs as crumb, i}
				{#if i > 0}<span class="separator">/</span>{/if}
				<a href={crumb.href}>{crumb.label}</a>
			{/each}
		</nav>

		<!-- Market Header -->
		<header class="market-header">
			<div class="market-info">
				<h1 class="market-question">{contract.question}</h1>
				<div class="market-meta">
					<span class="creator">Created by {shortenAddress(contract.creator)}</span>
					<span class="created">Created {formatDate(contract.createdAt)}</span>
					{#if contract.resolvesAt}
						<span class="resolves">Resolves {formatDate(contract.resolvesAt)}</span>
					{/if}
				</div>
			</div>
			<div class="market-status">
				<div class="status-badge status-{contract.status}">
					{contract.status.toUpperCase()}
				</div>
				{#if isResolved}
					<div class="resolution-badge resolution-{resolution}">
						{resolution?.toUpperCase()}
					</div>
				{/if}
			</div>
		</header>

		<!-- Main Content Grid -->
		<div class="market-grid">
			<!-- Left Column -->
			<div class="market-main">
				<!-- Price Display -->
				<div class="price-display">
					<div class="price-column yes">
						<div class="price-label">YES</div>
						<div class="price-value">{formatPercentage(yesProbability)}</div>
						<div class="price-odds">{(1 / yesProbability).toFixed(2)}x</div>
					</div>
					<div class="price-column no">
						<div class="price-label">NO</div>
						<div class="price-value">{formatPercentage(noProbability)}</div>
						<div class="price-odds">{(1 / noProbability).toFixed(2)}x</div>
					</div>
				</div>

				<!-- Betting Panel -->
				{#if !isResolved}
					<BettingPanel {contract} />
				{:else}
					<div class="resolved-message">
						<h3>Market Resolved</h3>
						<p>This market resolved as <strong>{resolution?.toUpperCase()}</strong></p>
					</div>
				{/if}

				<!-- Price Chart -->
				<ApexMarketChart {contract} />

				<!-- Market Description -->
				{#if contract.description}
					<div class="market-description">
						<h3>Description</h3>
						<p>{contract.description}</p>
					</div>
				{/if}
			</div>

			<!-- Right Column -->
			<div class="market-sidebar">
				<!-- Market Stats -->
				<MarketStats {contract} {bets} />

				<!-- Order Book -->
				<OrderBook {bets} />
			</div>
		</div>
	</div>
{/if}

<style>
	.container {
		width: 100%;
		max-width: 1600px;
		margin: 0 auto;
		padding: 1rem 2rem 4rem;
	}

	.error-state {
		text-align: center;
		padding: 4rem 1rem;
	}

	.error-state h1 {
		color: #ef4444;
		margin-bottom: 1rem;
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

	.separator {
		margin: 0 0.5rem;
	}

	.market-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.market-question {
		font-size: 1.875rem;
		font-weight: 700;
		color: #f9fafb;
		margin-bottom: 0.5rem;
		line-height: 1.2;
	}

	.market-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.market-status {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-active {
		background-color: #059669;
		color: white;
	}

	.status-resolved {
		background-color: #1f2937;
		color: #9ca3af;
	}

	.resolution-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.resolution-yes {
		background-color: #059669;
		color: white;
	}

	.resolution-no {
		background-color: #dc2626;
		color: white;
	}

	.market-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 2.5rem;
	}

	@media (min-width: 1400px) {
		.market-grid {
			grid-template-columns: 1fr 400px;
		}
	}

	@media (min-width: 1920px) {
		.market-grid {
			grid-template-columns: 1fr 420px;
		}
	}

	.price-display {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 2.5rem;
		background-color: var(--bg-card);
		padding: 2rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
	}

	.price-column {
		text-align: center;
		padding: 1.5rem;
		border-radius: var(--border-radius-lg);
		background-color: var(--bg-elevated);
		border: 1px solid var(--border-color);
		transition: all 0.3s ease;
	}

	.price-column:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
	}

	.price-column.yes {
		border-color: var(--color-yes);
		background: linear-gradient(135deg, rgba(184, 8, 65, 0.1) 0%, rgba(184, 8, 65, 0.05) 100%);
	}

	.price-column.no {
		border-color: var(--color-no);
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
	}

	.price-label {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.price-value {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.price-column.yes .price-label,
	.price-column.yes .price-value {
		color: #10b981;
	}

	.price-column.no .price-label,
	.price-column.no .price-value {
		color: #ef4444;
	}

	.price-odds {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.resolved-message {
		text-align: center;
		padding: 2.5rem;
		background-color: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		margin-bottom: 2.5rem;
	}

	.resolved-message h3 {
		color: #f9fafb;
		margin-bottom: 0.5rem;
	}

	.market-description {
		background-color: var(--bg-card);
		padding: 2rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		margin-top: 2.5rem;
	}

	.market-description h3 {
		color: #f9fafb;
		margin-bottom: 1rem;
	}

	.market-description p {
		color: #d1d5db;
		line-height: 1.6;
	}

	.btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		text-decoration: none;
		font-weight: 500;
	}

	.btn-primary {
		background-color: #4ade80;
		color: #111827;
	}

	.btn-primary:hover {
		background-color: #22c55e;
	}

	@media (max-width: 768px) {
		.market-header {
			flex-direction: column;
			gap: 1rem;
		}

		.market-status {
			align-items: flex-start;
		}

		.market-grid {
			grid-template-columns: 1fr;
		}

		.market-question {
			font-size: 1.5rem;
		}

		.market-meta {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
