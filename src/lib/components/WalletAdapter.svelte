<script lang="ts">
	import { onMount } from 'svelte';
	import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
	import { walletStore } from '$lib/stores/wallet.js';

	let walletAdapter: PhantomWalletAdapter | null = null;
	let connecting = $state(false);
	let error: string | null = $state(null);

	onMount(() => {
		walletAdapter = new PhantomWalletAdapter();
		walletAdapter.on('connect', (publicKey) => {
			walletStore.setPublicKey(publicKey.toBase58());
			walletStore.setConnected(true);
		});
		walletAdapter.on('disconnect', () => {
			walletStore.setPublicKey(null);
			walletStore.setConnected(false);
		});
		walletAdapter.on('error', (err) => {
			error = err instanceof Error ? err.message : 'Wallet error';
		});
	});

	async function handleConnect() {
		if (!walletAdapter) {
			error = 'Wallet adapter not initialized';
			return;
		}

		try {
			connecting = true;
			error = null;
			await walletAdapter.connect();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to connect wallet';
		} finally {
			connecting = false;
		}
	}

	async function handleDisconnect() {
		if (!walletAdapter) {
			error = 'Wallet adapter not initialized';
			return;
		}

		try {
			error = null;
			await walletAdapter.disconnect();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to disconnect wallet';
		}
	}
</script>

{#if $walletStore.connected}
	<div class="wallet-connected">
		<span class="wallet-address">
			{$walletStore.publicKey?.slice(0, 4)}...{$walletStore.publicKey?.slice(-4)}
		</span>
		<button class="disconnect-button" disabled={connecting} onclick={handleDisconnect}>
			{connecting ? 'Disconnecting...' : 'Disconnect'}
		</button>
	</div>
{:else}
	<button class="connect-button" disabled={connecting} onclick={handleConnect}>
		{connecting ? 'Connecting...' : 'Connect Wallet'}
	</button>
{/if}
{#if error}
	<div class="error">{error}</div>
{/if}

<style>
	.wallet-connected {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.wallet-address {
		padding: 0.5rem 0.75rem;
		background-color: #2d2d2d;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.connect-button,
	.disconnect-button {
		padding: 0.5rem 1rem;
		background-color: #4ade80;
		color: #000;
		border: none;
		border-radius: 0.25rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.connect-button:hover:not(:disabled),
	.disconnect-button:hover:not(:disabled) {
		background-color: #22c55e;
	}

	.connect-button:disabled,
	.disconnect-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.disconnect-button {
		background-color: #ef4444;
		color: #fff;
	}

	.disconnect-button:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.error {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		border-radius: 0.25rem;
		color: #ef4444;
		font-size: 0.875rem;
	}
</style>
