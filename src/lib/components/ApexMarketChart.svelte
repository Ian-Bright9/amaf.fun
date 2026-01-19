<script lang="ts">
	import { onMount } from 'svelte';
	import ApexPriceChart from './ApexPriceChart.svelte';
	import ApexCandlestickChart from './ApexCandlestickChart.svelte';
	import { generateChartData } from '../utils/mockPriceData.js';
	import type { Contract } from '../../types/index.js';

	interface Props {
		contract: Contract;
	}

	let { contract }: Props = $props();

	let chartData = $state(generateChartData(7));
	let activeTab = $state('line');

	const stats = $derived(chartData.stats);

	onMount(() => {
		chartData = generateChartData(7);
	});
</script>

<div class="market-chart-container">
	<div class="stats-row">
		<div class="stat-item">
			<span class="stat-label">Current YES</span>
			<span class="stat-value yes">{(stats.currentYes * 100).toFixed(1)}%</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Current NO</span>
			<span class="stat-value no">{(stats.currentNo * 100).toFixed(1)}%</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">High</span>
			<span class="stat-value">{(stats.high * 100).toFixed(1)}%</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">24h Change</span>
			<span
				class="stat-value"
				class:positive={stats.change24h > 0}
				class:negative={stats.change24h < 0}
			>
				{stats.change24h > 0 ? '+' : ''}{stats.change24h.toFixed(1)}%
			</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Volume</span>
			<span class="stat-value">{stats.volume.toFixed(0)}</span>
		</div>
	</div>

	<div class="tabs">
		<button
			class="tab-btn"
			class:active={activeTab === 'line'}
			onclick={() => (activeTab = 'line')}
		>
			Line Chart
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'candlestick'}
			onclick={() => (activeTab = 'candlestick')}
		>
			Candlestick
		</button>
	</div>

	<div class="chart-wrapper">
		{#if activeTab === 'line'}
			<ApexPriceChart data={chartData.prices} height={400} />
		{:else}
			<ApexCandlestickChart data={chartData.candlestick} height={400} />
		{/if}
	</div>
</div>

<style>
	.market-chart-container {
		background: #1f2937;
		border-radius: 0.5rem;
		padding: 1rem;
		width: 100%;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #374151;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: #f3f4f6;
	}

	.stat-value.yes {
		color: #10b981;
	}

	.stat-value.no {
		color: #ef4444;
	}

	.stat-value.positive {
		color: #10b981;
	}

	.stat-value.negative {
		color: #ef4444;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.tab-btn {
		background: #374151;
		color: #d1d5db;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.tab-btn:hover {
		background: #4b5563;
	}

	.tab-btn.active {
		background: #10b981;
		color: #ffffff;
		font-weight: 600;
	}

	.chart-wrapper {
		width: 100%;
	}

	@media (max-width: 640px) {
		.stats-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.stat-item:last-child {
			grid-column: span 2;
		}
	}
</style>
