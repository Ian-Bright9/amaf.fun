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
		<div class="wallet-icon">
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M10 2C5.58 2 2 6.58 2 10C2 13.42 5.58 18 10 18C14.42 18 18 13.42 18 10C18 6.58 14.42 2 10 2ZM10 3.5C13.59 3.5 16.5 6.41 16.5 10C16.5 13.59 13.59 16.5 10 16.5C6.41 16.5 3.5 13.59 3.5 10ZM10 5.5C11.93 5.5 13.5 7.07 13.5 9C13.5 10.93 11.93 12.5 10 12.5C8.07 12.5 6.5 10.93 6.5 9C6.5 7.07 8.07 5.5 10 5.5ZM10 6.5C8.62 6.5 7.5 7.62 7.5 9C7.5 10.38 8.62 11.5 10 11.5C11.38 11.5 12.5 10.38 12.5 9C12.5 7.62 11.38 6.5 10 6.5Z"
					fill="currentColor"
				/>
			</svg>
		</div>
		<div class="wallet-info">
			<span class="wallet-address">
				{$walletStore.publicKey?.slice(0, 4)}...{$walletStore.publicKey?.slice(-4)}
			</span>
			<span class="wallet-network">Devnet</span>
		</div>
		<button class="disconnect-button" disabled={connecting} onclick={handleDisconnect}>
			{connecting ? 'Disconnecting...' : 'Disconnect'}
		</button>
	</div>
{:else}
	<button class="connect-button" disabled={connecting} onclick={handleConnect}>
		{#if connecting}
			<span class="loading-spinner"></span>
			Connecting...
		{:else}
			<span class="button-icon">
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9 1C4.58 1 1 4.58 1 9C1 13.42 4.58 17 9 17C13.42 17 17 13.42 17 9C17 4.58 13.42 1 9 1ZM9 2.5C12.59 2.5 15.5 5.41 15.5 9C15.5 12.59 12.59 15.5 9 15.5C5.41 15.5 2.5 12.59 2.5 9ZM9 4.5C10.93 4.5 12.5 6.07 12.5 8C12.5 9.93 10.93 11.5 9 11.5C7.07 11.5 5.5 9.93 5.5 8C5.5 6.07 7.07 4.5 9 4.5Z"
						fill="currentColor"
					/>
				</svg>
			</span>
			Connect Wallet
		{/if}
	</button>
{/if}
{#if error}
	<div class="error-toast">{error}</div>
{/if}

<style>
	.wallet-connected {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		background-color: rgba(26, 26, 26, 0.8);
		border: 1px solid #2d2d2d;
		border-radius: 0.5rem;
	}

	.wallet-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: linear-gradient(135deg, #09c285 0%, #05a372 100%);
		border-radius: 0.375rem;
		color: #000;
	}

	.wallet-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.wallet-address {
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		font-weight: 500;
		color: #fff;
	}

	.wallet-network {
		font-size: 0.6875rem;
		color: #09c285;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.connect-button,
	.disconnect-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background-color: #09c285;
		color: #000;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		letter-spacing: 0.025em;
	}

	.connect-button:hover:not(:disabled),
	.disconnect-button:hover:not(:disabled) {
		background-color: #05a372;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(9, 194, 133, 0.3);
	}

	.connect-button:disabled,
	.disconnect-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.disconnect-button {
		background-color: #2d2d2d;
		color: #fff;
		border: 1px solid #3d3d3d;
	}

	.disconnect-button:hover:not(:disabled) {
		background-color: #3d3d3d;
		box-shadow: none;
	}

	.button-icon {
		display: flex;
		align-items: center;
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(0, 0, 0, 0.3);
		border-top-color: #000;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-toast {
		position: fixed;
		top: 5rem;
		right: 1.5rem;
		padding: 0.75rem 1rem;
		background-color: rgba(239, 68, 68, 0.95);
		color: #fff;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		z-index: 10000;
		animation: slideIn 0.3s ease;
		max-width: 300px;
		backdrop-filter: blur(8px);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
