<script lang="ts">
	import { formatCurrency, formatDate } from '../utils/format.js';
	import type { Contract, Bet } from '../../types/index.js';

	export let contract: Contract;
	export let bets: Bet[];

	// Calculate statistics
	$: uniqueUsers = new Set(bets.map((bet) => bet.user)).size;
	$: totalVolume = bets.reduce((sum, bet) => sum + bet.amount, 0);
	$: yesVolume = bets
		.filter((bet) => bet.position === 'yes')
		.reduce((sum, bet) => sum + bet.amount, 0);
	$: noVolume = bets
		.filter((bet) => bet.position === 'no')
		.reduce((sum, bet) => sum + bet.amount, 0);
	$: averageBetSize = bets.length > 0 ? totalVolume / bets.length : 0;

	// Time calculations
	$: timeToResolution = contract.expirationTimestamp
		? contract.expirationTimestamp - new Date().getTime()
		: null;

	$: daysToResolution = timeToResolution
		? Math.max(0, Math.floor(timeToResolution / (1000 * 60 * 60 * 24)))
		: null;

	$: hoursToResolution = timeToResolution
		? Math.max(0, Math.floor((timeToResolution % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
		: null;
</script>

<div class="market-stats">
	<h3>Market Statistics</h3>

	<!-- Key Metrics -->
	<div class="stats-grid">
		<div class="stat-item">
			<div class="stat-label">Total Volume</div>
			<div class="stat-value">{formatCurrency(totalVolume)}</div>
		</div>

		<div class="stat-item">
			<div class="stat-label">Participants</div>
			<div class="stat-value">{uniqueUsers}</div>
		</div>

		<div class="stat-item">
			<div class="stat-label">Total Bets</div>
			<div class="stat-value">{bets.length}</div>
		</div>

		<div class="stat-item">
			<div class="stat-label">Avg Bet Size</div>
			<div class="stat-value">{formatCurrency(averageBetSize, 0)}</div>
		</div>
	</div>

	<!-- Volume Breakdown -->
	<div class="volume-breakdown">
		<h4>Volume Breakdown</h4>
		<div class="volume-bars">
			<div
				class="volume-bar yes"
				style="width: {totalVolume > 0 ? (yesVolume / totalVolume) * 100 : 50}%"
			></div>
			<div
				class="volume-bar no"
				style="width: {totalVolume > 0 ? (noVolume / totalVolume) * 100 : 50}%"
			></div>
		</div>
		<div class="volume-legend">
			<div class="legend-item yes">
				<span>YES: {formatCurrency(yesVolume)}</span>
			</div>
			<div class="legend-item no">
				<span>NO: {formatCurrency(noVolume)}</span>
			</div>
		</div>
	</div>

	<!-- Time Information -->
	{#if contract.resolvesAt && daysToResolution !== null}
		<div class="time-info">
			<h4>Time to Resolution</h4>
			{#if daysToResolution === 0}
				<div class="time-urgent">
					<span class="time-value">Resolves Today</span>
					{#if hoursToResolution !== null && hoursToResolution > 0}
						<span class="time-detail">in {hoursToResolution}h</span>
					{/if}
				</div>
			{:else if daysToResolution === 1}
				<div class="time-soon">
					<span class="time-value">Tomorrow</span>
				</div>
			{:else if daysToResolution <= 7}
				<div class="time-soon">
					<span class="time-value">{daysToResolution} days</span>
				</div>
			{:else}
				<div class="time-normal">
					<span class="time-value">{daysToResolution} days</span>
				</div>
			{/if}
			<div class="resolution-date">
				{formatDate(contract.resolvesAt)}
			</div>
		</div>
	{/if}

	<!-- Market Information -->
	<div class="market-info">
		<h4>Market Details</h4>
		<div class="info-row">
			<span class="info-label">Creator:</span>
			<span class="info-value">Unknown</span>
		</div>
		<div class="info-row">
			<span class="info-label">Created:</span>
			<span class="info-value">{formatDate(contract.createdAt)}</span>
		</div>
		<div class="info-row">
			<span class="info-label">Status:</span>
			<span class="info-value status-{contract.status}">
				{contract.status.toUpperCase()}
			</span>
		</div>
		{#if contract.status === 'resolved'}
			<div class="info-row">
				<span class="info-label">Resolution:</span>
				<span class="info-value resolution-{contract.resolution}">
					{contract.resolution?.toUpperCase()}
				</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.market-stats {
		background-color: #1f2937;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 2rem;
	}

	.market-stats h3 {
		color: #f9fafb;
		margin-bottom: 1rem;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.market-stats h4 {
		color: #d1d5db;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.stat-item {
		background-color: #374151;
		padding: 0.75rem;
		border-radius: 0.375rem;
		text-align: center;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: #f9fafb;
	}

	.volume-breakdown {
		margin-bottom: 1.5rem;
	}

	.volume-bars {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
		background-color: #374151;
	}

	.volume-bar {
		height: 100%;
		transition: width 0.3s ease;
	}

	.volume-bar.yes {
		background-color: #10b981;
	}

	.volume-bar.no {
		background-color: #ef4444;
	}

	.volume-legend {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
	}

	.legend-item {
		color: #d1d5db;
	}

	.legend-item.yes {
		color: #10b981;
	}

	.legend-item.no {
		color: #ef4444;
	}

	.time-info {
		margin-bottom: 1.5rem;
	}

	.time-urgent {
		color: #f59e0b;
		font-weight: 600;
	}

	.time-soon {
		color: #fbbf24;
		font-weight: 600;
	}

	.time-normal {
		color: #10b981;
		font-weight: 600;
	}

	.time-value {
		display: block;
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}

	.time-detail {
		display: block;
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.resolution-date {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-top: 0.5rem;
	}

	.market-info {
		border-top: 1px solid #374151;
		padding-top: 1rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.info-label {
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.info-value {
		font-size: 0.875rem;
		color: #d1d5db;
		font-weight: 500;
	}

	.info-value.status-active {
		color: #10b981;
	}

	.info-value.status-resolved {
		color: #6b7280;
	}

	.info-value.resolution-yes {
		color: #10b981;
	}

	.info-value.resolution-no {
		color: #ef4444;
	}
</style>
