<script lang="ts">
	import ApexPriceChart from './ApexPriceChart.svelte';
	import type { Contract } from '../../types/index.js';
	import { generatePriceHistory, calculateChartStats } from '$lib/utils/chartData.js';
	import { formatCurrency, formatPercentage } from '$lib/utils/format.js';

	interface Props {
		contract: Contract;
	}

	let { contract }: Props = $props();

	let selectedRange = $state<'1D' | '7D' | '30D' | 'ALL'>('7D');

	const priceHistory = $derived(generatePriceHistory(contract, selectedRange));

	const stats = $derived(calculateChartStats(priceHistory, contract?.totalVolume || 0));

	function selectRange(range: '1D' | '7D' | '30D' | 'ALL') {
		selectedRange = range;
	}
</script>

<div class="market-chart-container">
	<div class="chart-header">
		<h3>Price History</h3>
		<div class="time-range-selector">
			<button class:active={selectedRange === '1D'} onclick={() => selectRange('1D')}>1D</button>
			<button class:active={selectedRange === '7D'} onclick={() => selectRange('7D')}>7D</button>
			<button class:active={selectedRange === '30D'} onclick={() => selectRange('30D')}>30D</button>
			<button class:active={selectedRange === 'ALL'} onclick={() => selectRange('ALL')}>ALL</button>
		</div>
	</div>

	<div class="chart-stats">
		<div class="stat-item">
			<span class="stat-label">Current YES</span>
			<span class="stat-value yes">{formatPercentage(stats.currentYes)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Current NO</span>
			<span class="stat-value no">{formatPercentage(stats.currentNo)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">High</span>
			<span class="stat-value">{formatPercentage(stats.high)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">24h Change</span>
			<span class="stat-value {stats.change24h >= 0 ? 'positive' : 'negative'}">
				{stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
			</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Volume</span>
			<span class="stat-value">{formatCurrency(stats.volume)}</span>
		</div>
	</div>

	<ApexPriceChart data={priceHistory} height={400} />

	<div class="chart-legend">
		<div class="legend-item">
			<div class="legend-dot yes-dot"></div>
			<span class="legend-label">YES</span>
			<span class="legend-value">{formatPercentage(stats.currentYes)}</span>
		</div>
		<div class="legend-item">
			<div class="legend-dot no-dot"></div>
			<span class="legend-label">NO</span>
			<span class="legend-value">{formatPercentage(stats.currentNo)}</span>
		</div>
	</div>
</div>

<style>
	.market-chart-container {
		background-color: var(--bg-card, #181926);
		border: 1px solid var(--border-color, #2d2d2d);
		border-radius: var(--border-radius-lg, 0.75rem);
		padding: 1.5rem;
		width: 100%;
		min-height: 600px;
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color, #2d2d2d);
	}

	.chart-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #fff);
		margin: 0;
	}

	.time-range-selector {
		display: flex;
		gap: 0.5rem;
		background-color: var(--bg-elevated, #1a1a1a);
		padding: 0.25rem;
		border-radius: var(--border-radius-md, 0.5rem);
	}

	.time-range-selector button {
		padding: 0.375rem 0.75rem;
		border: none;
		background-color: transparent;
		color: var(--text-secondary, #9ca3af);
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: var(--border-radius-sm, 0.375rem);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.time-range-selector button:hover {
		color: var(--text-primary, #fff);
		background-color: var(--bg-hover, #2d2d2d);
	}

	.time-range-selector button.active {
		background-color: var(--color-primary, #6366f1);
		color: white;
	}

	.chart-stats {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: var(--bg-elevated, #1a1a1a);
		border-radius: var(--border-radius-md, 0.5rem);
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary, #9ca3af);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary, #fff);
	}

	.stat-value.yes {
		color: var(--color-yes, #10b981);
	}

	.stat-value.no {
		color: var(--color-no, #ef4444);
	}

	.stat-value.positive {
		color: var(--color-yes, #10b981);
	}

	.stat-value.negative {
		color: var(--color-no, #ef4444);
	}

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		padding: 1rem;
		margin-top: 1rem;
		background-color: var(--bg-elevated, #1a1a1a);
		border-radius: var(--border-radius-md, 0.5rem);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		box-shadow: 0 0 6px currentColor;
	}

	.legend-dot.yes-dot {
		background-color: var(--color-yes, #10b981);
		color: var(--color-yes, #10b981);
	}

	.legend-dot.no-dot {
		background-color: var(--color-no, #ef4444);
		color: var(--color-no, #ef4444);
	}

	.legend-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #9ca3af);
	}

	.legend-value {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary, #fff);
	}

	@media (max-width: 1024px) {
		.chart-stats {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 768px) {
		.chart-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.chart-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.chart-legend {
			flex-direction: column;
			gap: 0.75rem;
		}

		.legend-item {
			justify-content: flex-start;
		}
	}
</style>
