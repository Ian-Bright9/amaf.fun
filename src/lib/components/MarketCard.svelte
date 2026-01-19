<script lang="ts">
	import { formatAmafCurrency, formatPercentage } from '$lib/utils/format.js';
	import type { MarketData } from '../../types/index.js';

	interface Props {
		market: MarketData;
	}

	let { market }: Props = $props();

	function getTrend(marketData: MarketData): 'up' | 'down' | 'neutral' {
		const change = (marketData.contract.currentYesPrice || 0) - (marketData.contract.yesPrice || 0);
		if (change > 0.01) return 'up';
		if (change < -0.01) return 'down';
		return 'neutral';
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
		const formatDate = (date: string) => {
			const d = new Date(date);
			return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
		};
		return formatDate(resolvesAt);
	}
</script>

<a href={`/market/${market.contract.id}`} class="market-card">
	<div class="card-header">
		<span class="status-badge status-{market.contract.status}">{market.contract.status}</span>
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
			{formatAmafCurrency(market.volume)}
		</span>
		<span class="bets">{market.contract.betCount || 0} bets</span>
	</div>
</a>

<style>
	.market-card {
		display: flex;
		flex-direction: column;
		padding: 1.75rem;
		background-color: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		height: 100%;
	}

	.market-card:hover {
		border-color: var(--color-primary);
		background-color: var(--bg-elevated);
		transform: translateY(-8px) scale(1.02);
		box-shadow:
			0 16px 40px rgba(184, 8, 65, 0.4),
			0 8px 16px rgba(0, 0, 0, 0.2);
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
</style>
