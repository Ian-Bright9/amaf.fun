<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore } from '$lib/stores/wallet.js';
	import { Connection, PublicKey } from '@solana/web3.js';
	import { checkCanClaim } from '$lib/api/amaf-token.js';
	import { getAmafBalance } from '$lib/utils/tokens.js';
	import { deriveTokenMintAddress } from '$lib/utils/pda.js';
	import { solanaClient } from '$lib/api/solana.js';
	import { DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
	import idl from '$lib/idl/amafcoin.json';

	let claiming = $state(false);
	let error: string | null = $state(null);
	let success: string | null = $state(null);
	let connection: Connection | null = $state(null);
	let countdown = $state('');
	let canClaim = $state(false);
	let programInitialized = $state(false);

	onMount(() => {
		connection = new Connection(DEFAULT_NETWORK, 'confirmed');
		updateCountdown();
		const interval = setInterval(() => updateCountdown(), 1000);
		return () => clearInterval(interval);
	});

	$effect(() => {
		if ($walletStore.connected && connection && $walletStore.publicKey && !programInitialized) {
			initializeProgram();
		}
	});

	async function initializeProgram() {
		if (!window.solana || !window.solana.publicKey) return;
		try {
			const provider = await solanaClient.initializeProvider(window.solana);
			await solanaClient.initializeProgram(provider);
			programInitialized = true;
		} catch (err) {
			console.error('Error initializing program:', err);
		}
	}

	$effect(() => {
		if ($walletStore.connected && connection && $walletStore.publicKey && programInitialized) {
			updateClaimEligibility();
		}
	});

	async function updateClaimEligibility() {
		if (!$walletStore.publicKey || !connection) return;

		try {
			const publicKey = new PublicKey($walletStore.publicKey);
			const result = await checkCanClaim(connection, publicKey);
			canClaim = result.canClaim;

			if (!result.canClaim && result.lastClaimTime) {
				walletStore.setLastClaimTime(new Date(result.lastClaimTime * 1000).toISOString());
			}
		} catch (err) {
			console.error('Error checking claim eligibility:', err);
		}
	}

	function updateCountdown() {
		if (!$walletStore.lastClaimTime) {
			countdown = '';
			return;
		}

		const lastClaim = new Date($walletStore.lastClaimTime);
		const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
		const now = new Date();

		if (now >= nextClaim) {
			countdown = '';
		} else {
			const hours = Math.floor((nextClaim.getTime() - now.getTime()) / (1000 * 60 * 60));
			const minutes = Math.floor(
				((nextClaim.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)
			);
			const seconds = Math.floor(((nextClaim.getTime() - now.getTime()) % (1000 * 60)) / 1000);
			countdown = `${hours}h ${minutes}m ${seconds}s`;
		}
	}

	async function handleClaim() {
		if (!$walletStore.publicKey || !connection || !window.solana) {
			error = 'Wallet not connected';
			return;
		}

		try {
			claiming = true;
			error = null;
			success = null;

			if (!canClaim) {
				error = 'You can only claim once every 24 hours';
				return;
			}

			const transaction = await solanaClient.claimDailyTokens(window.solana);

			if (connection && window.solana) {
				const signature = await window.solana.signAndSendTransaction(transaction);
				await connection.confirmTransaction(signature, 'confirmed');
				walletStore.setLastClaimTime(new Date().toISOString());

				const tokenMint = deriveTokenMintAddress();
				const publicKey = new PublicKey($walletStore.publicKey);
				const newBalance = await getAmafBalance(connection, publicKey, tokenMint);
				walletStore.setAmafBalance(newBalance);

				success = 'Successfully claimed 100 ¤!';
				updateClaimEligibility();
			} else {
				error = 'Failed to claim tokens - no signature returned';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to claim tokens';
		} finally {
			claiming = false;
		}
	}

	function dismissSuccess() {
		success = null;
	}

	function dismissError() {
		error = null;
	}
</script>

<div class="daily-claim">
	<div class="claim-card">
		<div class="claim-header">
			<div class="claim-icon">
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 2L2 7L12 12L22 7L12 2Z"
						stroke="#AB9FF2"
						stroke-width="2"
						stroke-linejoin="round"
						fill="rgba(171, 159, 242, 0.1)"
					/>
					<path d="M2 17L12 22L22 17" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
					<path d="M2 7V17" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
					<path d="M22 7V17" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
					<path d="M12 12V22" stroke="#AB9FF2" stroke-width="2" stroke-linejoin="round" />
				</svg>
			</div>
			<div class="claim-info">
				<h2>Daily Token Claim</h2>
				<p>Claim 100 ¤ every 24 hours</p>
			</div>
		</div>

		<div class="claim-status">
			{#if countdown}
				<div class="countdown">
					<span class="countdown-icon">⏰</span>
					<span class="countdown-text">Next claim in: {countdown}</span>
				</div>
			{:else}
				<button
					class="claim-button"
					disabled={claiming || !$walletStore.connected}
					onclick={handleClaim}
				>
					{#if claiming}
						<span class="spinner"></span>
						Claiming...
					{:else}
						Claim 100 ¤
					{/if}
				</button>
			{/if}
		</div>

		{#if !$walletStore.connected}
			<div class="connect-prompt">
				<p>Connect your wallet to claim daily tokens</p>
			</div>
		{/if}
	</div>

	{#if success}
		<button class="success-toast" onclick={dismissSuccess} type="button">
			<div class="toast-content">
				<span class="toast-icon">✓</span>
				<span class="toast-message">{success}</span>
			</div>
		</button>
	{/if}

	{#if error}
		<button class="error-toast" onclick={dismissError} type="button">
			<div class="toast-content">
				<span class="toast-icon">✕</span>
				<span class="toast-message">{error}</span>
			</div>
		</button>
	{/if}
</div>

<style>
	.daily-claim {
		padding: 2rem;
	}

	.claim-card {
		background-color: rgba(26, 26, 26, 0.9);
		border: 1px solid #2d2d2d;
		border-radius: 0.75rem;
		padding: 2rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.claim-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.claim-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		background: linear-gradient(135deg, rgba(171, 159, 242, 0.2) 0%, rgba(138, 127, 232, 0.1) 100%);
		border-radius: 0.75rem;
	}

	.claim-info h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #fff;
	}

	.claim-info p {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.claim-status {
		margin-bottom: 1.5rem;
	}

	.countdown {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background-color: rgba(171, 159, 242, 0.1);
		border: 1px solid rgba(171, 159, 242, 0.3);
		border-radius: 0.5rem;
	}

	.countdown-icon {
		font-size: 1.5rem;
	}

	.countdown-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: #ab9ff2;
	}

	.claim-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background-color: #ab9ff2;
		color: #000;
		border: none;
		border-radius: 0.5rem;
		font-weight: 700;
		font-size: 1.125rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.claim-button:hover:not(:disabled) {
		background-color: #9a8fe1;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(171, 159, 242, 0.4);
	}

	.claim-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.connect-prompt {
		padding: 1rem;
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		text-align: center;
	}

	.connect-prompt p {
		margin: 0;
		font-size: 0.875rem;
		color: #ef4444;
		font-weight: 500;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
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

	.success-toast,
	.error-toast {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		animation: slideUp 0.3s ease;
		z-index: 10000;
		backdrop-filter: blur(8px);
		border: none;
		width: auto;
		display: block;
	}

	.success-toast {
		background-color: rgba(9, 194, 133, 0.95);
		border: 1px solid rgba(9, 194, 133, 0.3);
	}

	.error-toast {
		background-color: rgba(239, 68, 68, 0.95);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.toast-icon {
		font-size: 1.25rem;
		font-weight: 700;
	}

	.toast-message {
		font-size: 0.875rem;
		font-weight: 500;
		color: #fff;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
