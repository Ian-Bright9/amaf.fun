<script lang="ts">
	import DailyClaim from '$lib/components/DailyClaim.svelte';
	import BalanceDisplay from '$lib/components/BalanceDisplay.svelte';
</script>

<div class="wallet-page">
	<nav class="breadcrumbs">
		<a href="/" class="breadcrumb-item">Home</a>
		<span class="separator">/</span>
		<span class="breadcrumb-item current">Wallet</span>
	</nav>
	<div class="wallet-header">
		<div class="header-content">
			<div class="header-left">
				<h1>Wallet</h1>
				<p class="header-subtitle">Manage your SOL and ¤</p>
			</div>
		</div>
	</div>

	<div class="wallet-content">
		<section class="balance-section">
			<BalanceDisplay />
		</section>

		<section class="claim-section">
			<DailyClaim />
		</section>
	</div>
</div>

<style>
	.wallet-page {
		min-height: calc(100vh - 350px);
		width: 100%;
		max-width: 1800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.wallet-header {
		margin-bottom: 3rem;
		padding: 0 2rem;
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

	.header-content {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		width: 100%;
		max-width: 1800px;
		margin: 0 auto;
		gap: 2rem;
	}

	.header-left {
		flex: 1;
	}

	.header-left h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #ab9ff2 0%, #8a7fe8 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.header-subtitle {
		margin: 0;
		font-size: 1.125rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.wallet-content {
		width: 100%;
		max-width: 1800px;
		margin: 0 auto;
		display: grid;
		gap: 2.5rem;
	}

	.balance-section {
		margin-bottom: 0;
	}

	.claim-section {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		.wallet-header {
			padding: 0 1rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
		}

		.header-left h1 {
			font-size: 2rem;
		}

		.header-subtitle {
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.header-left h1 {
			font-size: 1.75rem;
		}

		.wallet-page {
			padding: 1rem;
		}
	}
</style>
