<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		type: string;
		series: any[];
		options: any;
		height?: number | string;
		width?: number | string;
	}

	let { type, series, options, height = 400, width = '100%' }: Props = $props();

	let chartElement: HTMLDivElement;
	let ApexCharts: any = null;
	let chart: any = null;

	function updateChart() {
		if (!chart) return;
		chart.updateOptions(options, false, true);
		chart.updateSeries(series);
	}

	onMount(async () => {
		const ApexChartsModule = await import('apexcharts');
		ApexCharts = ApexChartsModule.default;

		if (chartElement && ApexCharts) {
			const newChart = new ApexCharts(chartElement, {
				type,
				series,
				chart: {
					height,
					width,
					background: 'transparent',
					toolbar: {
						show: false
					},
					zoom: {
						enabled: false
					}
				},
				...options
			});
			chart = newChart;
			newChart.render();
		}
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	$effect(updateChart);
</script>

<div bind:this={chartElement}></div>
