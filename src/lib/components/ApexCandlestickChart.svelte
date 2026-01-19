<script lang="ts">
	import ApexChart from './ApexChart.svelte';
	import type { CandlestickDataPoint } from '../../types/index.js';
	import type ApexCharts from 'apexcharts';

	interface Props {
		data: CandlestickDataPoint[];
		height?: number | string;
	}

	let { data, height = 400 }: Props = $props();

	const series = [
		{
			data: data.map((p) => ({
				x: p.x,
				y: p.y
			}))
		}
	];

	const options: ApexCharts.ApexOptions = {
		chart: {
			background: '#111827',
			foreColor: '#d1d5db'
		},
		plotOptions: {
			candlestick: {
				wick: {
					useFillColor: true
				},
				colors: {
					upward: '#10b981',
					downward: '#ef4444'
				}
			}
		},
		xaxis: {
			type: 'category',
			labels: {
				style: {
					colors: '#9ca3af'
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
			min: 0,
			max: 1,
			labels: {
				style: {
					colors: '#9ca3af'
				},
				formatter: (value: number) => `${(value * 100).toFixed(0)}%`
			}
		},
		grid: {
			borderColor: '#374151',
			strokeDashArray: 4
		},
		tooltip: {
			enabled: true,
			theme: 'dark',
			style: {
				fontSize: '12px'
			},
			x: {
				show: true
			},
			y: {
				formatter: (value: number) => `${(value * 100).toFixed(1)}%`
			}
		}
	};
</script>

<div class="chart-container">
	<ApexChart type="candlestick" {series} {options} {height} />
</div>

<style>
	.chart-container {
		width: 100%;
	}
</style>
