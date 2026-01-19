<script lang="ts">
	import { formatPercentage } from '../utils/format.js';
	import type { Contract } from '../../types/index.js';

	let { contract }: { contract: Contract } = $props();

	const yesColor = '#10b981';
	const noColor = '#ef4444';
	const gridColor = '#2d2d2d';

	const days = 7;

	function generateHistory(contractData: Contract) {
		const result = [];
		for (let i = days; i >= 0; i--) {
			const volatility = 0.02 + Math.random() * 0.05;
			let yesP = (contractData?.yesPrice || 0.5) + Math.sin(i * 0.5) * volatility * 0.5;
			let noP = 1 - yesP;

			yesP = Math.max(0.05, Math.min(0.95, yesP));
			noP = Math.max(0.05, Math.min(0.95, noP));

			result.push({
				date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
				yesPrice: yesP,
				noPrice: noP
			});
		}
		return result;
	}

	const yesPrice = $derived(contract?.yesPrice || 0);
	const noPrice = $derived(contract?.noPrice || 0);
	const history = $derived(generateHistory(contract));
	const maxYes = $derived(Math.max(...history.map((h) => h.yesPrice)));
	const maxNo = $derived(Math.max(...history.map((h) => h.noPrice)));
</script>

<div class="price-chart">
	<h3>Price History</h3>

	<div class="chart-stats">
		<div class="stat-item">
			<span class="stat-label">Current YES</span>
			<span class="stat-value yes">{formatPercentage(yesPrice)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Current NO</span>
			<span class="stat-value no">{formatPercentage(noPrice)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">High</span>
			<span class="stat-value">{formatPercentage(Math.max(maxYes, maxNo))}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">24h Change</span>
			<span class="stat-value positive">+2.3%</span>
		</div>
	</div>

	<div class="chart-wrapper">
		<svg viewBox="0 0 100 60" class="chart-svg">
			<defs>
				<linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color={yesColor} stop-opacity="0.2" />
					<stop offset="100%" stop-color={yesColor} stop-opacity="0" />
				</linearGradient>
				<linearGradient id="noGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color={noColor} stop-opacity="0.2" />
					<stop offset="100%" stop-color={noColor} stop-opacity="0" />
				</linearGradient>
			</defs>

			{#each [0, 20, 40, 60, 80] as y}
				<line x1="0" y1={y / 2} x2="100" y2={y / 2} class="grid-line" />
			{/each}

			{#each [20, 40, 60, 80, 100] as x}
				<line x1={x} y1="0" x2={x} y2="60" class="grid-line vertical" />
			{/each}

			<path
				d={`M0,${60 - history[0].yesPrice * 58}
	${history
		.map((p, i) => {
			const x = (i / (history.length - 1)) * 100;
			const y = 60 - p.yesPrice * 58;
			return `L${x},${y}`;
		})
		.join(' ')}
	L100,${60 - history[history.length - 1].yesPrice * 58}
	L100,60 Z`}
				fill="url(#yesGradient)"
				class="chart-area yes-area"
			/>

			<path
				d={`M0,${60 - history[0].noPrice * 58}
	${history
		.map((p, i) => {
			const x = (i / (history.length - 1)) * 100;
			const y = 60 - p.noPrice * 58;
			return `L${x},${y}`;
		})
		.join(' ')}
	L100,${60 - history[history.length - 1].noPrice * 58}
	L100,60 Z`}
				fill="url(#noGradient)"
				class="chart-area no-area"
			/>

			<path
				d={`M0,${60 - history[0].yesPrice * 58}
	${history
		.map((p, i) => {
			const x = (i / (history.length - 1)) * 100;
			const y = 60 - p.yesPrice * 58;
			return `L${x},${y}`;
		})
		.join(' ')}`}
				fill="none"
				stroke={yesColor}
				stroke-width="2"
				class="chart-line yes-line"
			/>

			<path
				d={`M0,${60 - history[0].noPrice * 58}
	${history
		.map((p, i) => {
			const x = (i / (history.length - 1)) * 100;
			const y = 60 - p.noPrice * 58;
			return `L${x},${y}`;
		})
		.join(' ')}`}
				fill="none"
				stroke={noColor}
				stroke-width="2"
				class="chart-line no-line"
			/>

			{#each history as point, i}
				<g class="data-point-group">
					<circle
						cx={(i / (history.length - 1)) * 100}
						cy={60 - point.yesPrice * 58}
						r="2"
						fill="#1a1a1a"
						stroke={yesColor}
						stroke-width="2"
						class="data-point"
					/>
					<circle
						cx={(i / (history.length - 1)) * 100}
						cy={60 - point.noPrice * 58}
						r="2"
						fill="#1a1a1a"
						stroke={noColor}
						stroke-width="2"
						class="data-point"
					/>
				</g>
			{/each}

			<line x1="100" y1="0" x2="100" y2="60" class="current-price-line" />
			<circle
				cx="100"
				cy={60 - yesPrice * 58}
				r="4"
				fill={yesColor}
				class="current-point yes-current"
			>
				<animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
			</circle>
			<circle cx="100" cy={60 - noPrice * 58} r="4" fill={noColor} class="current-point no-current">
				<animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
			</circle>
		</svg>
	</div>

	<div class="chart-legend">
		<div class="legend-item">
			<div class="legend-dot yes-dot"></div>
			<span class="legend-label">YES</span>
			<span class="legend-value">{formatPercentage(yesPrice)}</span>
		</div>
		<div class="legend-item">
			<div class="legend-dot no-dot"></div>
			<span class="legend-label">NO</span>
			<span class="legend-value">{formatPercentage(noPrice)}</span>
		</div>
	</div>
</div>

<style>
	.price-chart {
		background-color: #1a1a1a;
		border: 1px solid #2d2d2d;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.price-chart h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #fff;
		margin-bottom: 1.5rem;
	}

	.chart-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #2d2d2d;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #9ca3af;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.stat-value.yes {
		color: #10b981;
	}

	.stat-value.positive {
		color: #10b981;
	}

	.chart-wrapper {
		position: relative;
		background: linear-gradient(180deg, #111827 0%, #1a1a1a 100%);
		border-radius: 0.5rem;
		padding: 1.5rem;
		border: 1px solid #2d2d2d;
		margin-bottom: 1.5rem;
	}

	.chart-svg {
		width: 100%;
		height: 180px;
		display: block;
		overflow: visible;
	}

	.grid-line {
		stroke: #2d2d2d;
		stroke-width: 0.25;
		stroke-dasharray: 4, 4;
		opacity: 0.5;
	}

	.grid-line.vertical {
		stroke-dasharray: none;
		stroke-width: 0.125;
	}

	.chart-area {
		stroke: none;
		opacity: 0.3;
		transition: opacity 0.3s ease;
	}

	.chart-line {
		stroke-linecap: round;
		stroke-linejoin: round;
		transition: stroke-dashoffset 1s ease;
	}

	.chart-line.yes-line {
		stroke: #10b981;
		stroke-width: 2;
		filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.3));
	}

	.chart-line.no-line {
		stroke: #ef4444;
		stroke-width: 2;
		filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.3));
	}

	.data-point-group {
		opacity: 0;
		animation: fadeIn 0.3s ease forwards;
	}

	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}

	.data-point {
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.data-point:hover {
		r: 4;
		stroke-width: 3;
	}

	.data-point.yes-point:hover {
		fill: #10b981;
		filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.6));
	}

	.data-point.no-point:hover {
		fill: #ef4444;
		filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6));
	}

	.current-price-line {
		stroke: #09c285;
		stroke-width: 1;
		stroke-dasharray: 4, 4;
		opacity: 0.5;
	}

	.current-point {
		transition: all 0.2s ease;
	}

	.current-point.yes-current:hover {
		r: 6;
		filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.8));
	}

	.current-point.no-current:hover {
		r: 6;
		filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8));
	}

	.chart-legend {
		display: flex;
		gap: 2rem;
		padding: 1rem;
		background-color: #2d2d2d;
		border-radius: 0.5rem;
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
	}

	.legend-dot.yes-dot {
		background-color: #10b981;
		box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
	}

	.legend-dot.no-dot {
		background-color: #ef4444;
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
	}

	.legend-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #d1d5db;
	}

	.legend-value {
		font-size: 0.875rem;
		font-weight: 700;
		color: #fff;
	}

	@media (max-width: 768px) {
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
