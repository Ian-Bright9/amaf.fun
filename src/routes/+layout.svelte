<script lang="ts">
	import WalletAdapter from '$lib/components/WalletAdapter.svelte';
	let { children } = $props();
	let walletAdapter = $state<any>(null);

	function setWalletAdapter(adapter: any) {
		walletAdapter = adapter;
		(window as any).walletAdapter = adapter;
	}
</script>

<svelte:head>
	<title>AMAF.fun - Prediction Markets on Solana</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link rel="stylesheet" href="/lib/styles/variables.css" />
	<style>
		:global(body) {
			background-color: var(--bg-primary);
			color: var(--text-primary);
			font-family:
				'Inter',
				-apple-system,
				BlinkMacSystemFont,
				'Segoe UI',
				Roboto,
				Oxygen,
				Ubuntu,
				Cantarell,
				'Open Sans',
				'Helvetica Neue',
				sans-serif;
			margin: 0;
			padding: 0;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		}

		:global(a) {
			color: #b80841;
			text-decoration: none;
			transition: color 0.2s ease;
		}

		:global(a:hover) {
			color: #9e0738;
		}
	</style>
</svelte:head>

<header class="header">
	<div class="header-content">
		<div class="header-left">
			<a href="/" class="logo">
				<span class="logo-text">AMAF</span>
				<span class="logo-dot">.fun</span>
			</a>
			<nav class="nav">
				<a href="/market">Markets</a>
				<a href="/market/create">Create</a>
				<a href="/wallet">Wallet</a>
			</nav>
		</div>
		<div class="header-right">
			<WalletAdapter />
		</div>
	</div>
</header>

<main class="main">
	{@render children()}
</main>

<footer class="footer">
	<div class="footer-content">
		<div class="footer-section">
			<h4>Product</h4>
			<a href="/market">Markets</a>
			<a href="/market/create">Create Market</a>
			<a href="/api">API</a>
		</div>
		<div class="footer-section">
			<h4>Company</h4>
			<a href="/about">About</a>
			<a href="/blog">Blog</a>
			<a href="/careers">Careers</a>
		</div>
		<div class="footer-section">
			<h4>Support</h4>
			<a href="/help">Help Center</a>
			<a href="/faq">FAQ</a>
			<a href="/contact">Contact</a>
		</div>
		<div class="footer-section">
			<h4>Legal</h4>
			<a href="/terms">Terms of Service</a>
			<a href="/privacy">Privacy Policy</a>
		</div>
	</div>
	<div class="footer-bottom">
		<p>&copy; 2026 AMAF.fun - Prediction Markets on Solana</p>
		<p class="disclaimer">
			Trading on AMAF.fun involves risk. You could lose your entire investment.
		</p>
	</div>
</footer>

<style>
	.header {
		background-color: rgba(10, 10, 10, 0.95);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-color);
		padding: 0.75rem 1.5rem;
		position: sticky;
		top: 0;
		z-index: 1000;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 1800px;
		margin: 0 auto;
		gap: 2rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 2.5rem;
	}

	.logo {
		display: flex;
		align-items: baseline;
		gap: 0.125rem;
		text-decoration: none !important;
		font-weight: 700;
		font-size: 1.5rem;
	}

	.logo-text {
		background: linear-gradient(135deg, #09c285 0%, #05a372 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.logo-dot {
		color: #6b7280;
		font-weight: 400;
	}

	.nav {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.nav a {
		color: var(--text-secondary);
		font-weight: 500;
		font-size: 0.9375rem;
		padding: 0.5rem 0;
		position: relative;
		transition: all 0.2s ease;
	}

	.nav a:hover {
		color: var(--text-primary);
		transform: translateY(-1px);
	}

	.nav a::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, #09c285, transparent);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.nav a:hover::after {
		opacity: 1;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.main {
		min-height: calc(100vh - 350px);
		padding: 0;
		width: 100%;
		margin: 0 auto;
	}

	.footer {
		background-color: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		padding: 4rem 1.5rem 2rem;
		margin-top: auto;
	}

	.footer-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		width: 100%;
		max-width: 1800px;
		margin: 0 auto 3rem;
	}

	.footer-section h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.footer-section a {
		display: block;
		color: var(--text-secondary);
		font-size: 0.875rem;
		padding: 0.375rem 0;
		line-height: 1.5;
	}

	.footer-section a:hover {
		color: var(--text-primary);
	}

	.footer-bottom {
		width: 100%;
		max-width: 1800px;
		margin: 0 auto;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.footer-bottom p {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.disclaimer {
		color: var(--text-secondary) !important;
	}

	@media (min-width: 1400px) {
		.main {
			max-width: 1800px;
		}
	}

	@media (min-width: 1920px) {
		.main {
			max-width: 2000px;
		}
	}

	@media (min-width: 2560px) {
		.main {
			max-width: 2400px;
		}
	}

	@media (max-width: 768px) {
		.main {
			max-width: 100%;
		}

		.header-content {
			flex-direction: column;
			gap: 1rem;
		}

		.header-left {
			width: 100%;
			justify-content: space-between;
			gap: 1rem;
		}

		.header-right {
			width: 100%;
			justify-content: flex-end;
		}

		.nav {
			gap: 1rem;
		}

		.footer-content {
			grid-template-columns: repeat(2, 1fr);
		}

		.footer-bottom {
			flex-direction: column;
			text-align: center;
		}
	}

	@media (max-width: 480px) {
		.footer-content {
			grid-template-columns: 1fr;
		}
	}
</style>
