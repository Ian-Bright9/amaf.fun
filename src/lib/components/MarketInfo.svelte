<script lang="ts">
	import { formatCurrency, formatDate, shortenAddress } from '../utils/format.js';
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

	// Sort bets by timestamp (newest first) and limit to 3
	$: recentBets = bets.slice(0, 3);

	$: timeToResolution = contract.resolvesAt
		? new Date(contract.resolvesAt).getTime() - new Date().getTime()
		: null;
	$: daysToResolution = timeToResolution
		? Math.max(0, Math.floor(timeToResolution / (1000 * 60 * 60 * 24)))
		: null;
	$: hoursToResolution = timeToResolution
		? Math.max(0, Math.floor((timeToResolution % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
		: null;
</script>

<div class="market-info">
	<h3>Market Info</h3>

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
	<div class="market-details">
		<h4>Market Details</h4>
		<div class="info-row">
			<span class="info-label">Creator:</span>
			<span class="info-value">{shortenAddress(contract.creator)}</span>
		</div>
		<div class="info-row">
			<span class="info-label">Created:</span>
			<span class="info-value">{formatDate(contract.createdAt)}</span>
		</div>
		{#if (contract.status || 'active') === 'resolved'}
			<div class="info-row">
				<span class="info-label">Resolution:</span>
				<span class="info-value resolution-{contract.resolution}">
					{contract.resolution?.toUpperCase()}
				</span>
			</div>
		{/if}
	</div>

	<!-- Recent Activity (max 3 bets, smaller) -->
	{#if recentBets.length > 0}
		<div class="recent-activity">
			<h4>Recent Activity</h4>
			<div class="bets-list-small">
				{#each recentBets as bet (bet.id)}
					<div class="bet-item-small">
						<div class="bet-position {bet.position}">
							{bet.position.toUpperCase()}
						</div>
						<div class="bet-info">
							<div class="bet-amount">{formatCurrency(bet.amount)}</div>
							<div class="bet-time">{bet.timestamp ? formatDate(bet.timestamp) : ''}</div>
						</div>
						<div class="bet-user">{shortenAddress(bet.user)}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.market-info {
		background-color: #181926;
		padding: 1.5rem;
		border-radius: 0.5rem;
	}

	.market-info h3 {
		color: #cad3f5;
		margin-bottom: 1rem;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.market-info h4 {
		color: #b8c0e0;
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
		background-color: #363a4f;
		padding: 0.75rem;
		border-radius: 0.375rem;
		text-align: center;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #a5adcb;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: #cad3f5;
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
		background-color: #363a4f;
	}

	.volume-bar {
		height: 100%;
		transition: width 0.3s ease;
	}

	.volume-bar.yes {
		background-color: #a6da95;
	}

	.volume-bar.no {
		background-color: #ed8796;
	}

	.volume-legend {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
	}

	.legend-item {
		color: #b8c0e0;
	}

	.legend-item.yes {
		color: #a6da95;
	}

	.legend-item.no {
		color: #ed8796;
	}

	.time-info {
		margin-bottom: 1.5rem;
	}

	.time-urgent {
		color: #eed49f;
		font-weight: 600;
	}

	.time-soon {
		color: #f5c2e7;
		font-weight: 600;
	}

	.time-normal {
		color: #a6da95;
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
		color: #a5adcb;
		margin-top: 0.5rem;
	}

	.market-details {
		margin-bottom: 1.5rem;
		border-top: 1px solid #363a4f;
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
		color: #a5adcb;
	}

	.info-value {
		font-size: 0.875rem;
		color: #b8c0e0;
		font-weight: 500;
	}

	.info-value.resolution-yes {
		color: #a6da95;
	}

	.info-value.resolution-no {
		color: #ed8796;
	}

	.recent-activity {
		border-top: 1px solid #363a4f;
		padding-top: 1rem;
	}

	.bets-list-small {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.bet-item-small {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: #363a4f;
		border-radius: 0.25rem;
		padding: 0.5rem;
	}

	.bet-position {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		min-width: 32px;
		text-align: center;
	}

	.bet-position.yes {
		background-color: #a6da95;
		color: #24273a;
	}

	.bet-position.no {
		background-color: #ed8796;
		color: #24273a;
	}

	.bet-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.bet-amount {
		font-size: 0.75rem;
		font-weight: 600;
		color: #cad3f5;
	}

	.bet-time {
		font-size: 0.625rem;
		color: #a5adcb;
	}

	.bet-user {
		font-size: 0.625rem;
		color: #b8c0e0;
		font-family: monospace;
	}
</style>
