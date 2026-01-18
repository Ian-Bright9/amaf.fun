<script lang="ts">
	let { children } = $props();
</script>

<nav class="nav">
	<a href="/" class="nav-link">Home</a>
	<span class="nav-separator">/</span>
	<a href="/market" class="nav-link">Markets</a>
	<span class="nav-separator">/</span>
	{#if children}
		{@render children()}
	{/if}
</nav>

<style>
	.nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0;
		margin-bottom: 2rem;
	}

	.nav-link {
		color: #4ade80;
		text-decoration: none;
		font-weight: 600;
	}

	.nav-link:hover {
		text-decoration: underline;
	}

	.nav-separator {
		color: #6b7280;
	}
</style>
