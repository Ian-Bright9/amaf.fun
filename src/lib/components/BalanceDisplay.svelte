<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore } from '$lib/stores/wallet.js';
	import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
	import { getBalance } from '$lib/utils/wallet.js';

	let connection: Connection | null = $state(null);
	let solPrice = $state(0);

	$: if ($walletStore.connected && connection && $walletStore.publicKey) {
		updateBalance();
	}

	async function updateBalance() {
		if (!$walletStore.publicKey || !connection) return;

		try {
			const publicKey = new PublicKey($walletStore.publicKey);
			const balance = await getBalance(connection, publicKey);
			walletStore.setBalance(balance);
		} catch (error) {
			console.error('Error updating balance:', error);
		}
	}

	onMount(() => {
		connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
	});
</script>

<div class="balance-display">
	<div class="balance-card">
		<div class="balance-item">
			<div class="balance-header">
				<span class="balance-label">SOL Balance</span>
				<span class="balance-network">Mainnet</span>
			</div>
			<div class="balance-value">
				<span class="balance-amount">
					{($walletStore.balance / LAMPORTS_PER_SOL).toFixed(4)}
				</span>
				<span class="balance-symbol">SOL</span>
			</div>
		</div>

		<div class="balance-divider"></div>

		<div class="balance-item amaf">
			<div class="balance-header">
				<span class="balance-label">AMAF Balance</span>
				<span class="balance-tag">Free Tokens</span>
			</div>
			<div class="balance-value">
				<span class="balance-amount">
					{$walletStore.amafBalance.toFixed(0)}
				</span>
				<span class="balance-symbol">AMAF</span>
			</div>
		</div>
	</div>

	{#if !$walletStore.connected}
		<div class="balance-placeholder">
			<p>Connect your wallet to view balances</p>
		</div>
	{/if}
</div>

<style>
	.balance-display {
		padding: 2rem;
	}

	.balance-card {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 0;
		background-color: rgba(26, 26, 26, 0.9);
		border: 1px solid #2d2d2d;
		border-radius: 0.75rem;
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.balance-item {
		text-align: center;
	}

	.balance-item.amaf {
		position: relative;
	}

	.balance-header {
		margin-bottom: 1rem;
	}

	.balance-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: #9ca3af;
		margin-bottom: 0.5rem;
	}

	.balance-network {
		display: block;
		font-size: 0.6875rem;
		color: #ab9ff2;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.balance-tag {
		display: inline-block;
		background-color: rgba(171, 159, 242, 0.2);
		color: #ab9ff2;
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		margin-left: 0.5rem;
	}

	.balance-value {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.25rem;
	}

	.balance-amount {
		font-size: 2.5rem;
		font-weight: 700;
		color: #fff;
		line-height: 1;
	}

	.balance-symbol {
		font-size: 1rem;
		font-weight: 600;
		color: #9ca3af;
	}

	.balance-item.amaf .balance-amount {
		background: linear-gradient(135deg, #ab9ff2 0%, #8a7fe8 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.balance-item.amaf .balance-symbol {
		color: #ab9ff2;
	}

	.balance-divider {
		width: 1px;
		background: linear-gradient(180deg, transparent 0%, #2d2d2d 50%, transparent 100%);
		margin: 0;
	}

	.balance-placeholder {
		text-align: center;
		padding: 3rem 2rem;
		background-color: rgba(26, 26, 26, 0.5);
		border: 1px dashed #2d2d2d;
		border-radius: 0.75rem;
	}

	.balance-placeholder p {
		margin: 0;
		font-size: 1rem;
		color: #9ca3af;
	}

	@media (max-width: 768px) {
		.balance-card {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.balance-divider {
			display: none;
		}

		.balance-amount {
			font-size: 2rem;
		}
	}
</style>
