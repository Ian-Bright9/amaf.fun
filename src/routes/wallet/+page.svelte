<script lang="ts">
	import WalletAdapter from '$lib/components/WalletAdapter.svelte';
	import DailyClaim from '$lib/components/DailyClaim.svelte';
	import BalanceDisplay from '$lib/components/BalanceDisplay.svelte';
</script>

<div class="wallet-page">
	<div class="wallet-header">
		<div class="header-content">
			<div class="header-left">
				<h1>Wallet</h1>
				<p class="header-subtitle">Manage your SOL and ¤</p>
			</div>
			<div class="header-right">
				<WalletAdapter />
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
		padding: 2rem;
	}

	.wallet-header {
		margin-bottom: 3rem;
		padding: 0 2rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1400px;
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
		color: #9ca3af;
		font-weight: 500;
	}

	.header-right {
		flex-shrink: 0;
	}

	.wallet-content {
		max-width: 1400px;
		margin: 0 auto;
		display: grid;
		gap: 2rem;
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

		.header-right {
			width: 100%;
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
