<script lang="ts">
	import { onMount } from 'svelte';
	import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
	import { Connection, PublicKey } from '@solana/web3.js';
	import { walletStore } from '$lib/stores/wallet.js';
	import { getBalance } from '$lib/utils/wallet.js';
	import { getAmafBalance } from '$lib/utils/tokens.js';
	import { deriveTokenMintAddress } from '$lib/utils/pda.js';
	import { DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';

	let walletAdapter: PhantomWalletAdapter | null = null;
	let connecting = $state(false);
	let error: string | null = $state(null);
	let connection: Connection | null = $state(null);
	let network = $state('Devnet');

	export function getWalletAdapter(): PhantomWalletAdapter | null {
		return walletAdapter;
	}

	onMount(async () => {
		connection = new Connection(DEFAULT_NETWORK, 'confirmed');
		walletAdapter = new PhantomWalletAdapter();
		(window as any).walletAdapter = walletAdapter;

		walletAdapter.on('connect', async (publicKey) => {
			walletStore.setPublicKey(publicKey.toBase58());
			walletStore.setConnected(true);

			try {
				if (!connection) {
					console.error('Connection not initialized');
					return;
				}
				const solBalance = await getBalance(connection, publicKey);
				walletStore.setBalance(solBalance);

				const tokenMint = deriveTokenMintAddress();
				const amafBalance = await getAmafBalance(connection, publicKey, tokenMint);
				walletStore.setAmafBalance(amafBalance);
			} catch (err) {
				console.error('Error fetching balances:', err);
			}
		});

		walletAdapter.on('disconnect', () => {
			walletStore.setPublicKey(null);
			walletStore.setConnected(false);
			walletStore.setBalance(0);
			walletStore.setAmafBalance(0);
		});

		walletAdapter.on('error', (err) => {
			error = err instanceof Error ? err.message : 'Wallet error';
		});

		try {
			if (walletAdapter.readyState === 'Installed') {
				await walletAdapter.connect();
			}
		} catch (err) {
			console.log('Auto-connect failed:', err);
		}
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

	function installPhantom() {
		window.open('https://phantom.app/', '_blank');
	}
</script>

{#if $walletStore.connected}
	<div class="wallet-connected">
		<div class="wallet-icon">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M12 2L2 7L12 12L22 7L12 2Z"
					stroke="#AB9FF2"
					stroke-width="2"
					stroke-linejoin="round"
					fill="#AB9FF2"
				/>
				<path d="M2 17L12 22L22 17" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
				<path d="M2 7V17" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
				<path d="M22 7V17" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
				<path d="M12 12V22" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
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
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 2L2 7L12 12L22 7L12 2Z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linejoin="round"
						fill="currentColor"
					/>
					<path
						d="M2 17L12 22L22 17"
						stroke="currentColor"
						stroke-width="2"
						stroke-linejoin="round"
					/>
					<path d="M2 7V17" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
					<path d="M22 7V17" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
					<path d="M12 12V22" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
				</svg>
			</span>
			Connect Phantom
		{/if}
	</button>
	<a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" class="install-link">
		Install Phantom
	</a>
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
		width: 2.5rem;
		height: 2.5rem;
		background: linear-gradient(135deg, #ab9ff2 0%, #8a7fe8 100%);
		border-radius: 0.5rem;
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
		color: #ab9ff2;
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
		background-color: #ab9ff2;
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
		background-color: #9a8fe1;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(171, 159, 242, 0.3);
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

	.install-link {
		display: block;
		color: #9ca3af;
		font-size: 0.75rem;
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid #2d2d2d;
		transition: all 0.2s ease;
		margin-top: 0.5rem;
	}

	.install-link:hover {
		color: #fff;
		border-color: #3d3d3d;
		background-color: rgba(26, 26, 26, 0.5);
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
