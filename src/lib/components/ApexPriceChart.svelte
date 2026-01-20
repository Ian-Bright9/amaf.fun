<script lang="ts">
	import ApexChart from './ApexChart.svelte';
	import type { PriceDataPoint } from '../../types/index.js';
	import type ApexCharts from 'apexcharts';

	interface Props {
		data: PriceDataPoint[];
		height?: number | string;
	}

	let { data, height = 400 }: Props = $props();

	const yesData = $derived(data.map((p) => p.yesPrice));
	const noData = $derived(data.map((p) => p.noPrice));
	const timestamps = $derived(
		data.map((p) => {
			const date = new Date(p.timestamp);
			return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
		})
	);

	const series = $derived([
		{
			name: 'YES',
			data: yesData
		},
		{
			name: 'NO',
			data: noData
		}
	]);

	const options = $derived<ApexCharts.ApexOptions>({
		chart: {
			background: 'transparent',
			foreColor: '#d1d5db',
			animations: {
				enabled: true,
				speed: 800
			}
		},
		colors: ['#10b981', '#ef4444'],
		stroke: {
			curve: 'smooth' as const,
			width: 2
		},
		fill: {
			type: 'gradient' as const,
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.7,
				opacityTo: 0.1,
				stops: [0, 100]
			}
		},
		dataLabels: {
			enabled: false
		},
		xaxis: {
			categories: timestamps,
			labels: {
				style: {
					colors: '#9ca3af',
					fontSize: '12px'
				},
				rotate: -45
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: false
			},
			tooltip: {
				enabled: true
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
			strokeDashArray: 4,
			position: 'back' as const
		},
		tooltip: {
			enabled: true,
			theme: 'dark' as const,
			style: {
				fontSize: '12px'
			},
			x: {
				show: true
			},
			y: {
				formatter: (value: number) => `${(value * 100).toFixed(2)}%`
			},
			marker: {
				show: true
			}
		},
		legend: {
			position: 'top' as const,
			horizontalAlign: 'left' as const,
			showForSingleSeries: true
		},
		responsive: [
			{
				breakpoint: 768,
				options: {
					chart: {
						height: 300
					},
					xaxis: {
						labels: {
							rotate: -90,
							fontSize: '10px'
						}
					}
				}
			}
		]
	});
</script>

<div class="chart-container">
	<ApexChart type="line" {series} {options} {height} />
</div>

<style>
	.chart-container {
		width: 100%;
	}
</style>
