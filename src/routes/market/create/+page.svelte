<script lang="ts">
	import { onMount } from 'svelte';
	import { createContract } from '$lib/api/contracts.js';
	import { marketsStore } from '$lib/stores/markets.js';
	import { walletStore } from '$lib/stores/wallet.js';
	import { goto } from '$app/navigation';
	import { Connection, Transaction } from '@solana/web3.js';

	let question = $state('');
	let description = $state('');
	let resolvesAt = $state('');
	let submitting = $state(false);
	let error = $state('');
	let connection: Connection;

	onMount(() => {
		connection = new Connection('https://api.devnet.solana.com', 'confirmed');
	});

	async function signTransactionFromBase64(
		base64Tx: string,
		walletAdapter: any,
		conn: Connection
	): Promise<string> {
		if (!walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const txBuffer = Buffer.from(base64Tx, 'base64');
		const transaction = Transaction.from(txBuffer);

		const signedTx = await walletAdapter.signTransaction(transaction);
		const signature = await conn.sendRawTransaction(signedTx.serialize(), {
			skipPreflight: false,
			preflightCommitment: 'confirmed'
		});

		await conn.confirmTransaction(signature, 'confirmed');

		return signature;
	}

	async function handleSubmit() {
		if (!question || !resolvesAt) {
			error = 'Please fill in all required fields';
			return;
		}

		if (!$walletStore.connected || !$walletStore.publicKey) {
			error = 'Please connect your wallet to create a market';
			return;
		}

		const resolveDate = new Date(resolvesAt);
		const now = new Date();
		if (resolveDate <= now) {
			error = 'Resolution date must be in future';
			return;
		}

		if (question.length < 10) {
			error = 'Question must be at least 10 characters long';
			return;
		}

		submitting = true;
		error = '';

		try {
			marketsStore.setLoading(true);

			const walletAdapter = (window as any).walletAdapter;
			if (!walletAdapter) {
				error = 'Wallet not available';
				return;
			}

			const result = await createContract({
				question,
				resolvesAt,
				creator: $walletStore.publicKey
			});

			const signature = await signTransactionFromBase64(
				result.transaction,
				walletAdapter,
				connection
			);

			await new Promise((resolve) => setTimeout(resolve, 2000));

			goto(`/market/${result.contractAddress}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create market';
		} finally {
			submitting = false;
			marketsStore.setLoading(false);
		}
	}
</script>

<div class="container">
	<div class="header">
		<h1>Create New Market</h1>
		<p>Launch your prediction market on the blockchain</p>
	</div>

	{#if !$walletStore.connected}
		<div class="wallet-warning">
			<div class="warning-icon">⚠️</div>
			<h3>Wallet Not Connected</h3>
			<p>Please connect your wallet to create a new market.</p>
		</div>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="form"
	>
		{#if error}
			<div class="error-alert">
				<span class="error-icon">⚠️</span>
				<span>{error}</span>
			</div>
		{/if}

		<div class="form-section">
			<h2>Market Details</h2>

			<div class="form-group">
				<label for="question">Question *</label>
				<input
					id="question"
					bind:value={question}
					type="text"
					placeholder="Will Solana reach $500 by end of 2026?"
					required
					disabled={submitting}
				/>
				<small>Your question should have a clear yes/no answer</small>
			</div>

			<div class="form-group">
				<label for="description">Description</label>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Add context and details about this market..."
					rows="3"
					disabled={submitting}
				></textarea>
				<small>Optional: Provide additional context</small>
			</div>

			<div class="form-group">
				<label for="resolvesAt">Resolution Date *</label>
				<input
					id="resolvesAt"
					bind:value={resolvesAt}
					type="datetime-local"
					required
					disabled={submitting}
				/>
				<small>When will this market be resolved?</small>
			</div>
		</div>

		<div class="form-actions">
			<button
				type="submit"
				class="btn btn-primary"
				disabled={submitting || !$walletStore.connected}
			>
				{#if submitting}
					<span class="loading-spinner"></span>
					Creating Market...
				{:else}
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9 1C4.58 1 1 4.58 1 9C1 13.42 4.58 17 9 17C13.42 17 17 13.42 17 9C17 4.58 13.42 1 9 1ZM9 2.5C12.59 2.5 15.5 5.41 15.5 9C15.5 12.59 12.59 15.5 9 15.5C5.41 15.5 2.5 12.59 2.5 9ZM9 4.5C10.93 4.5 12.5 6.07 12.5 9C12.5 10.93 10.93 12.5 9 12.5C7.07 12.5 5.5 10.93 5.5 9C5.5 7.07 7.07 4.5 9 4.5Z"
							fill="currentColor"
						/>
					</svg>
					Create Market
				{/if}
			</button>
			<a href="/market" class="btn btn-secondary">Cancel</a>
		</div>
	</form>
</div>

<style>
	.container {
		max-width: 700px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 0.75rem 0;
		background: linear-gradient(135deg, #b80841 0%, #9e0738 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.header p {
		color: #9ca3af;
		font-size: 1.125rem;
		margin: 0;
	}

	.form {
		background-color: #1a1a1a;
		border: 1px solid #2d2d2d;
		border-radius: 0.75rem;
		padding: 2rem;
	}

	.wallet-warning {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		background-color: rgba(245, 158, 11, 0.1);
		border: 1px solid #f59e0b;
		border-radius: 0.75rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.wallet-warning .warning-icon {
		font-size: 3rem;
	}

	.wallet-warning h3 {
		margin: 0;
		color: #f59e0b;
		font-size: 1.25rem;
	}

	.wallet-warning p {
		margin: 0;
		color: #9ca3af;
	}

	.error-alert {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		border-radius: 0.5rem;
		color: #ef4444;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.error-icon {
		font-size: 1.25rem;
	}

	.form-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #2d2d2d;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		color: #fff;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem 1rem;
		background-color: #2d2d2d;
		border: 1px solid #3d3d3d;
		border-radius: 0.5rem;
		color: #ffffff;
		font-size: 1rem;
		font-family: inherit;
		transition: all 0.2s ease;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #b80841;
		box-shadow: 0 0 0 3px rgba(184, 8, 65, 0.2);
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: #6b7280;
	}

	.form-group small {
		display: block;
		margin-top: 0.375rem;
		color: #6b7280;
		font-size: 0.8125rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #2d2d2d;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		transition: all 0.2s ease;
		border: none;
		cursor: pointer;
		letter-spacing: 0.025em;
		flex: 1;
	}

	.btn-primary {
		background-color: #b80841;
		color: #000;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #9e0738;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(184, 8, 65, 0.3);
	}

	.btn-secondary {
		background-color: transparent;
		color: #9ca3af;
		border: 1px solid #3d3d3d;
	}

	.btn-secondary:hover {
		color: #fff;
		border-color: #4d4d4d;
		background-color: rgba(255, 255, 255, 0.05);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
		box-shadow: none !important;
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

	@media (max-width: 640px) {
		.container {
			padding: 1rem;
		}

		.header h1 {
			font-size: 2rem;
		}

		.form {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
