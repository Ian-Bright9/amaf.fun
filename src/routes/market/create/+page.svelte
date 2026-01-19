<script lang="ts">
	import { walletStore } from '$lib/stores/wallet.js';
	import CreateMarketForm from '$lib/components/CreateMarketForm.svelte';
</script>

<div class="container">
	<nav class="breadcrumbs">
		<a href="/" class="breadcrumb-item">Home</a>
		<span class="separator">/</span>
		<a href="/market" class="breadcrumb-item">Markets</a>
		<span class="separator">/</span>
		<span class="breadcrumb-item current">Create</span>
	</nav>
	<div class="header">
		<h1>Create New Market</h1>
		<p>Launch your prediction market on the blockchain</p>
	</div>

	{#if !$walletStore.connected}
		<div class="wallet-warning">
			<div class="warning-icon">⚠️</div>
			<h3>Wallet Not Connected</h3>
			<p>Please connect your wallet to create a new market.</p>
			<a href="/" class="breadcrumb-link">Return Home</a>
		</div>
	{:else}
		<CreateMarketForm />
	{/if}
</div>

<style>
	.container {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		padding: 0 2rem 4rem;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--border-color);
		font-size: 0.875rem;
		margin-bottom: 2rem;
	}

	.breadcrumb-item {
		color: var(--text-secondary);
		text-decoration: none;
		padding: 0.5rem 0.75rem;
		border-radius: var(--border-radius-md);
		transition: all 0.2s ease;
	}

	.breadcrumb-item:hover {
		color: var(--text-primary);
		background-color: var(--bg-hover);
		transform: translateY(-1px);
	}

	.breadcrumb-item.current {
		color: var(--text-primary);
		font-weight: 600;
		pointer-events: none;
	}

	.separator {
		color: var(--text-muted);
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

	.wallet-warning {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2.5rem;
		background-color: rgba(245, 158, 11, 0.1);
		border: 1px solid var(--color-primary);
		border-radius: var(--border-radius-lg);
		margin-bottom: 2.5rem;
		text-align: center;
	}

	.wallet-warning .warning-icon {
		font-size: 3rem;
	}

	.breadcrumb-link {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background-color: var(--bg-elevated);
		color: var(--text-primary);
		text-decoration: none;
		border-radius: var(--border-radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.breadcrumb-link:hover {
		background-color: var(--color-primary);
		color: var(--text-dark);
		transform: translateY(-1px);
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
