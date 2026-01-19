<script lang="ts">
	import WalletAdapter from '$lib/components/WalletAdapter.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<title>AMAF.fun - Prediction Markets</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href="/favicon.ico" />
	<style>
		:global(body) {
			background-color: #0f0f0f;
			color: #ffffff;
			font-family:
				-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
				'Open Sans', 'Helvetica Neue', sans-serif;
			margin: 0;
			padding: 0;
		}

		:global(a) {
			color: #4ade80;
			text-decoration: none;
		}

		:global(a:hover) {
			text-decoration: underline;
		}
	</style>
</svelte:head>

<header class="header">
	<div class="header-content">
		<a href="/" class="logo">AMAF.fun</a>
		<nav class="nav">
			<a href="/market">Markets</a>
			<a href="/market/create">Create Market</a>
		</nav>
		<div class="wallet-section">
			<WalletAdapter />
		</div>
	</div>
</header>

<main class="main">
	{@render children()}

	<style>
		.header {
			background-color: #1a1a1a;
			border-bottom: 1px solid #333;
			padding: 1rem 2rem;
			position: sticky;
			top: 0;
			z-index: 1000;
		}

		.header-content {
			display: flex;
			align-items: center;
			justify-content: space-between;
			max-width: 1200px;
			margin: 0 auto;
			gap: 2rem;
		}

		.logo {
			font-size: 1.5rem;
			font-weight: 700;
			color: #4ade80;
			text-decoration: none !important;
		}

		.nav {
			display: flex;
			gap: 1.5rem;
			align-items: center;
		}

		.nav a {
			color: #9ca3af;
			transition: color 0.2s;
		}

		.nav a:hover {
			color: #ffffff;
		}

		.wallet-section {
			display: flex;
			align-items: center;
		}

		.main {
			min-height: calc(100vh - 200px);
			padding: 2rem;
			max-width: 1200px;
			margin: 0 auto;
		}

		.footer {
			background-color: #1a1a1a;
			border-top: 1px solid #333;
			padding: 2rem;
			text-align: center;
			color: #6b7280;
		}

		@media (max-width: 768px) {
			.header-content {
				flex-direction: column;
				gap: 1rem;
			}

			.nav {
				gap: 1rem;
			}

			.main {
				padding: 1rem;
			}
		}
	</style>
</main>

<footer class="footer">
	<p>&copy; 2026 AMAF.fun - Prediction Markets on Solana</p>
</footer>
