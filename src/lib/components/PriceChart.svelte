<script lang="ts">
	import { formatPercentage, formatDate } from '../utils/format.js';
	import type { Contract } from '../../types/index.js';

	export let contract: Contract;

	// Chart data and dimensions
	const chartWidth = 100;
	const chartHeight = 60;
	const padding = 5;

	// Mock price history data
	$: priceHistory = [
		{ date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), yesPrice: 0.45, noPrice: 0.55 },
		{ date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), yesPrice: 0.48, noPrice: 0.52 },
		{ date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), yesPrice: 0.52, noPrice: 0.48 },
		{ date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), yesPrice: 0.5, noPrice: 0.5 },
		{ date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), yesPrice: 0.55, noPrice: 0.45 },
		{ date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), yesPrice: 0.58, noPrice: 0.42 },
		{ date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), yesPrice: 0.62, noPrice: 0.38 },
		{ date: new Date(), yesPrice: contract.yesPrice, noPrice: contract.noPrice }
	];

	// Calculate scales
	$: maxPrice = Math.max(...priceHistory.map((p) => Math.max(p.yesPrice, p.noPrice)));
	$: minPrice = Math.min(...priceHistory.map((p) => Math.min(p.yesPrice, p.noPrice)));
	$: priceRange = maxPrice - minPrice || 0.1;

	// Generate path data for charts
	$: yesPath = generatePath(
		priceHistory.map((p, i) => ({
			x: (i / (priceHistory.length - 1)) * chartWidth,
			y:
				chartHeight - ((p.yesPrice - minPrice) / priceRange) * (chartHeight - 2 * padding) - padding
		}))
	);

	$: noPath = generatePath(
		priceHistory.map((p, i) => ({
			x: (i / (priceHistory.length - 1)) * chartWidth,
			y: chartHeight - ((p.noPrice - minPrice) / priceRange) * (chartHeight - 2 * padding) - padding
		}))
	);

	// Helper function to generate SVG path
	function generatePath(points: { x: number; y: number }[]): string {
		if (points.length === 0) return '';
		return points.reduce((path, point, index) => {
			return path + (index === 0 ? 'M' : 'L') + point.x.toFixed(1) + ',' + point.y.toFixed(1);
		}, '');
	}
</script>

<div class="price-chart">
	<h3>Price History</h3>
	<div class="chart-container">
		<svg viewBox="0 0 {chartWidth} {chartHeight}" class="chart-svg">
			<!-- Grid lines -->
			{#each Array(5) as _, i}
				<line
					x1="0"
					y1={(i * chartHeight) / 4}
					x2={chartWidth}
					y2={(i * chartHeight) / 4}
					class="grid-line"
				/>
			{/each}

			<!-- YES price line -->
			<path d={yesPath} fill="none" stroke="#10b981" stroke-width="2" class="price-line yes" />

			<!-- NO price line -->
			<path d={noPath} fill="none" stroke="#ef4444" stroke-width="2" class="price-line no" />

			<!-- Data points -->
			{#each priceHistory as point, i}
				<circle
					cx={(i / (priceHistory.length - 1)) * chartWidth}
					cy={chartHeight -
						((point.yesPrice - minPrice) / priceRange) * (chartHeight - 2 * padding) -
						padding}
					r="2"
					fill="#10b981"
					class="data-point"
				/>
				<circle
					cx={(i / (priceHistory.length - 1)) * chartWidth}
					cy={chartHeight -
						((point.noPrice - minPrice) / priceRange) * (chartHeight - 2 * padding) -
						padding}
					r="2"
					fill="#ef4444"
					class="data-point"
				/>
			{/each}
		</svg>
	</div>

	<!-- Legend -->
	<div class="legend">
		<div class="legend-item">
			<div class="legend-color yes"></div>
			<span>YES: {formatPercentage(contract.currentYesPrice)}</span>
		</div>
		<div class="legend-item">
			<div class="legend-color no"></div>
			<span>NO: {formatPercentage(contract.currentNoPrice)}</span>
		</div>
	</div>

	<!-- Time range -->
	<div class="time-range">
		<span>7 days ago</span>
		<span>Today</span>
	</div>
</div>

<style>
	.price-chart {
		background-color: #1f2937;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 2rem;
	}

	.price-chart h3 {
		color: #f9fafb;
		margin-bottom: 1rem;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.chart-container {
		background-color: #111827;
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.chart-svg {
		width: 100%;
		height: 120px;
		display: block;
	}

	.grid-line {
		stroke: #374151;
		stroke-width: 0.5;
		stroke-dasharray: 2, 2;
	}

	.price-line {
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.price-line.yes {
		stroke: #10b981;
	}

	.price-line.no {
		stroke: #ef4444;
	}

	.data-point {
		stroke: #111827;
		stroke-width: 1;
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 0.75rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #d1d5db;
		font-size: 0.875rem;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.legend-color.yes {
		background-color: #10b981;
	}

	.legend-color.no {
		background-color: #ef4444;
	}

	.time-range {
		display: flex;
		justify-content: space-between;
		color: #6b7280;
		font-size: 0.75rem;
	}
</style>
