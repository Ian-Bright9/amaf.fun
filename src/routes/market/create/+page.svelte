<script lang="ts">
	import { createContract } from '$lib/api/contracts.js';
	import { marketsStore } from '$lib/stores/markets.js';

	let question = '';
	let resolvesAt = '';
	let submitting = false;
	let error = '';

	async function handleSubmit() {
		if (!question || !resolvesAt) {
			error = 'Please fill in all fields';
			return;
		}

		submitting = true;
		error = '';

		try {
			marketsStore.setLoading(true);
			const contract = await createContract({
				question,
				resolvesAt,
				creator: 'temp-wallet'
			});
			marketsStore.addMarket({
				contract,
				yesPrice: 0.5,
				noPrice: 0.5,
				volume: 0,
				bets: []
			});
			question = '';
			resolvesAt = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create market';
		} finally {
			submitting = false;
			marketsStore.setLoading(false);
		}
	}
</script>

<div class="container">
	<h1>Create New Market</h1>

	<form on:submit|preventDefault={handleSubmit} class="form">
		{#if error}
			<div class="error">{error}</div>
		{/if}

		<div class="form-group">
			<label for="question">Question</label>
			<input
				id="question"
				bind:value={question}
				type="text"
				placeholder="Will Solana reach $500 by end of 2026?"
				required
			/>
			<small>Your question should have a clear yes/no answer</small>
		</div>

		<div class="form-group">
			<label for="resolvesAt">Resolution Date</label>
			<input id="resolvesAt" bind:value={resolvesAt} type="datetime-local" required />
			<small>When will this market be resolved?</small>
		</div>

		<button type="submit" class="btn btn-primary" disabled={submitting}>
			{submitting ? 'Creating...' : 'Create Market'}
		</button>
	</form>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 2rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.form-group input {
		padding: 0.75rem;
		background-color: #1a1a1a;
		border: 1px solid #333;
		border-radius: 0.5rem;
		color: #ffffff;
		font-size: 1rem;
	}

	.form-group input:focus {
		outline: none;
		border-color: #4ade80;
	}

	.form-group small {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.btn-primary {
		background-color: #4ade80;
		color: #000;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #22c55e;
		transform: translateY(-2px);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		padding: 1rem;
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		border-radius: 0.5rem;
		color: #ef4444;
	}
</style>
