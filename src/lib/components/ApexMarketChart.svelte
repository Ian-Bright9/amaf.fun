<script lang="ts">
	import PriceChart from './PriceChart.svelte';
	import type { Contract } from '../../types/index.js';

	interface Props {
		contract: Contract;
	}

	let { contract }: Props = $props();
</script>

<div class="market-chart-container">
	<PriceChart {contract} />
</div>

<style>
	.market-chart-container {
		background-color: #181926;
		border-radius: 0.5rem;
		padding: 1.5rem;
		width: 100%;
		height: 100%;
		min-height: 600px;
	}
</style>
