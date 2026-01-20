<script lang="ts">
	import ApexChart from './ApexChart.svelte';
	import type { PriceDataPoint } from '../../types/index.js';
	import type ApexCharts from 'apexcharts';

	interface Props {
		data: PriceDataPoint[];
		height?: number | string;
		volumes?: number[];
	}

	let { data, height = 200, volumes }: Props = $props();

	const timestamps = $derived(
		data.map((p) => {
			const date = new Date(p.timestamp);
			return `${date.getMonth() + 1}/${date.getDate()}`;
		})
	);

	const series = $derived([
		{
			name: 'Volume',
			data: volumes || data.map(() => Math.random() * 1000)
		}
	]);

	const options = $derived<ApexCharts.ApexOptions>({
		chart: {
			background: 'transparent',
			type: 'bar',
			foreColor: '#d1d5db'
		},
		colors: ['#6366f1'],
		plotOptions: {
			bar: {
				columnWidth: '60%',
				borderRadius: 2
			}
		},
		xaxis: {
			categories: timestamps,
			labels: {
				style: {
					colors: '#9ca3af',
					fontSize: '11px'
				}
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: false
			}
		},
		yaxis: {
			labels: {
				style: {
					colors: '#9ca3af'
				},
				formatter: (value: number) => value.toFixed(0)
			}
		},
		grid: {
			borderColor: '#374151',
			strokeDashArray: 4
		},
		tooltip: {
			enabled: true,
			theme: 'dark' as const
		}
	});
</script>

<div class="volume-chart">
	<ApexChart type="bar" {series} {options} {height} />
</div>

<style>
	.volume-chart {
		width: 100%;
	}
</style>
