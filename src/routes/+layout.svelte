<script lang="ts">
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

{@render children()}
