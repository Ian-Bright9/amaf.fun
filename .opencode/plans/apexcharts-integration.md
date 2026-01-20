# ApexCharts Integration Plan for Individual Market Components

## Executive Summary

This plan outlines the implementation of ApexCharts to replace the custom SVG-based `PriceChart` component in individual market pages. ApexCharts v5.3.6 is already installed, and wrapper components (`ApexChart`, `ApexPriceChart`) exist but are not being utilized.

## Current State Analysis

### Existing Components

**Individual Market Page**

- Location: `src/routes/(market)/[slug]/+page.svelte`
- Currently uses: `<ApexMarketChart {contract} />`

**Chart Component Hierarchy**

```
[slug]/+page.svelte
    └── ApexMarketChart.svelte (container)
            └── PriceChart.svelte (SVG-based - TO BE REPLACED)
```

**Available ApexCharts Components (Not Used)**

- `ApexChart.svelte` - Base wrapper with dynamic import and cleanup
- `ApexPriceChart.svelte` - Line chart with YES/NO price history
- `ApexCandlestickChart.svelte` - Candlestick chart variant

### Data Flow

```
Server Load (+page.server.ts)
    → Contract data with yesPrice/noPrice
    → Bet data array
    → [slug]/+page.svelte (contract prop)
    → ApexMarketChart (contract prop)
    → PriceChart (generates mock history from contract)
```

### Current Implementation Details

**PriceChart.svelte Features**

- Custom SVG rendering (no external library)
- Mock 7-day price history generation
- YES/NO dual line charts
- Animated data points
- Stats display (current prices, high, 24h change)
- Gradient fills
- Grid lines and legends

**ApexChart.svelte Features**

- Dynamic ApexCharts import (lazy loading)
- Type-safe props interface
- Cleanup on component destroy
- Reactive updates using `$effect` rune
- Configurable height, width, type, series, options

**ApexPriceChart.svelte Features**

- Line chart with YES/NO price history
- Smooth curve interpolation
- Gradient fill under lines
- Dark theme styling
- Percentage formatter for Y-axis
- Time-based X-axis labels

## Implementation Plan

### Phase 1: Update ApexMarketChart Component

**File: `src/lib/components/ApexMarketChart.svelte`**

**Changes:**

1. Replace `PriceChart` import with `ApexPriceChart`
2. Transform contract data into PriceDataPoint format
3. Add chart statistics display (current prices, high, low, 24h change)
4. Add volume indicators
5. Add time range selector (1D, 7D, 30D, All)

**New Component Structure:**

```svelte
<script lang="ts">
	import ApexPriceChart from './ApexPriceChart.svelte';
	import type { Contract, PriceDataPoint } from '../../types/index.js';
	import { generatePriceHistory, calculateChartStats } from '$lib/utils/chartData.js';
	import { formatCurrency, formatPercentage } from '$lib/utils/format.js';

	let { contract }: Props = $props();

	// Generate price history data
	let selectedRange = $state<'1D' | '7D' | '30D' | 'ALL'>('7D');

	const priceHistory = $derived(generatePriceHistory(contract, selectedRange));

	// Calculate statistics
	const stats = $derived(calculateChartStats(priceHistory, contract?.totalVolume || 0));
</script>

<div class="market-chart-container">
	<!-- Chart Header -->
	<div class="chart-header">
		<h3>Price History</h3>
		<div class="time-range-selector">
			<button class:active={selectedRange === '1D'}>1D</button>
			<button class:active={selectedRange === '7D'}>7D</button>
			<button class:active={selectedRange === '30D'}>30D</button>
			<button class:active={selectedRange === 'ALL'}>ALL</button>
		</div>
	</div>

	<!-- Chart Statistics -->
	<div class="chart-stats">
		<div class="stat-item">
			<span class="stat-label">Current YES</span>
			<span class="stat-value yes">{formatPercentage(stats.currentYes)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Current NO</span>
			<span class="stat-value no">{formatPercentage(stats.currentNo)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">High</span>
			<span class="stat-value">{formatPercentage(stats.high)}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">24h Change</span>
			<span class="stat-value {stats.change24h >= 0 ? 'positive' : 'negative'}">
				{stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
			</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Volume</span>
			<span class="stat-value">{formatCurrency(stats.volume)}</span>
		</div>
	</div>

	<!-- ApexCharts Component -->
	<ApexPriceChart data={priceHistory} height={400} />

	<!-- Chart Legend -->
	<div class="chart-legend">
		<div class="legend-item">
			<div class="legend-dot yes-dot"></div>
			<span class="legend-label">YES</span>
			<span class="legend-value">{formatPercentage(stats.currentYes)}</span>
		</div>
		<div class="legend-item">
			<div class="legend-dot no-dot"></div>
			<span class="legend-label">NO</span>
			<span class="legend-value">{formatPercentage(stats.currentNo)}</span>
		</div>
	</div>
</div>
```

### Phase 2: Create Chart Data Utility

**File: `src/lib/utils/chartData.ts` (new)**

**Purpose:** Centralize price history generation logic

**Implementation:**

```typescript
import type { Contract, PriceDataPoint } from '$types/index.js';

export type TimeRange = '1D' | '7D' | '30D' | 'ALL';

export function generatePriceHistory(
	contract: Contract | undefined,
	range: TimeRange = '7D'
): PriceDataPoint[] {
	if (!contract) return [];

	const hoursByRange: Record<TimeRange, number> = {
		'1D': 24,
		'7D': 24 * 7,
		'30D': 24 * 30,
		ALL: 24 * 90 // Max 90 days for "all"
	};

	const intervals = hoursByRange[range];
	const intervalHours = range === '1D' ? 1 : range === '7D' ? 4 : 6;
	const result: PriceDataPoint[] = [];
	const now = Date.now();

	for (let i = intervals; i >= 0; i -= intervalHours) {
		const timestamp = now - i * 60 * 60 * 1000;
		const volatility = 0.02 + Math.random() * 0.05;

		let yesP = (contract?.yesPrice || 0.5) + Math.sin(i * 0.5) * volatility * 0.5;
		let noP = 1 - yesP;

		yesP = Math.max(0.05, Math.min(0.95, yesP));
		noP = Math.max(0.05, Math.min(0.95, noP));

		result.push({
			timestamp,
			yesPrice: yesP,
			noPrice: noP
		});
	}

	return result;
}

export function calculateChartStats(priceHistory: PriceDataPoint[], currentVolume: number) {
	const currentYes = priceHistory[priceHistory.length - 1]?.yesPrice || 0;
	const currentNo = priceHistory[priceHistory.length - 1]?.noPrice || 0;

	const allYesPrices = priceHistory.map((p) => p.yesPrice);
	const high = Math.max(...allYesPrices);
	const low = Math.min(...allYesPrices);

	const change24h =
		priceHistory.length >= 2
			? ((currentYes - priceHistory[priceHistory.length - 2].yesPrice) /
					priceHistory[priceHistory.length - 2].yesPrice) *
				100
			: 0;

	return {
		currentYes,
		currentNo,
		high,
		low,
		change24h,
		volume: currentVolume
	};
}
```

### Phase 3: Enhance ApexPriceChart Component

**File: `src/lib/components/ApexPriceChart.svelte`**

**Enhancements:**

1. Add better responsive sizing
2. Add volume overlay or secondary axis
3. Add zoom functionality (optional)
4. Improve tooltip formatting
5. Add animation configuration

**Updated Configuration:**

```typescript
const options = $derived<ApexCharts.ApexOptions>({
	chart: {
		background: 'transparent',
		foreColor: '#d1d5db',
		animations: {
			enabled: true,
			easing: 'easeinout',
			speed: 800
		}
	},
	colors: ['#10b981', '#ef4444'],
	stroke: {
		curve: 'smooth',
		width: 2
	},
	fill: {
		type: 'gradient',
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
		position: 'back'
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
```

### Phase 4: Create Volume Chart Component (Optional Enhancement)

**File: `src/lib/components/ApexVolumeChart.svelte` (new)**

**Purpose:** Display trading volume over time

**Implementation:**

```svelte
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
			theme: 'dark'
		}
	});
</script>

<div class="volume-chart">
	<ApexChart type="bar" {series} {options} {height} />
</div>
```

### Phase 5: Update Styles

**File: `src/lib/components/ApexMarketChart.svelte`**

**Add comprehensive styles:**

```css
.market-chart-container {
	background-color: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: var(--border-radius-lg);
	padding: 1.5rem;
	width: 100%;
	min-height: 600px;
}

.chart-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--border-color);
}

.chart-header h3 {
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--text-primary);
	margin: 0;
}

.time-range-selector {
	display: flex;
	gap: 0.5rem;
	background-color: var(--bg-elevated);
	padding: 0.25rem;
	border-radius: var(--border-radius-md);
}

.time-range-selector button {
	padding: 0.375rem 0.75rem;
	border: none;
	background-color: transparent;
	color: var(--text-secondary);
	font-size: 0.75rem;
	font-weight: 500;
	border-radius: var(--border-radius-sm);
	cursor: pointer;
	transition: all 0.2s ease;
}

.time-range-selector button:hover {
	color: var(--text-primary);
	background-color: var(--bg-hover);
}

.time-range-selector button.active {
	background-color: var(--color-primary);
	color: white;
}

.chart-stats {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 1rem;
	margin-bottom: 1.5rem;
	padding: 1rem;
	background-color: var(--bg-elevated);
	border-radius: var(--border-radius-md);
}

.stat-item {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.stat-label {
	font-size: 0.75rem;
	color: var(--text-secondary);
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.stat-value {
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--text-primary);
}

.stat-value.yes {
	color: var(--color-yes);
}

.stat-value.no {
	color: var(--color-no);
}

.stat-value.positive {
	color: var(--color-yes);
}

.stat-value.negative {
	color: var(--color-no);
}

.chart-legend {
	display: flex;
	justify-content: center;
	gap: 2rem;
	padding: 1rem;
	margin-top: 1rem;
	background-color: var(--bg-elevated);
	border-radius: var(--border-radius-md);
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.legend-dot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	box-shadow: 0 0 6px currentColor;
}

.legend-dot.yes-dot {
	background-color: var(--color-yes);
	color: var(--color-yes);
}

.legend-dot.no-dot {
	background-color: var(--color-no);
	color: var(--color-no);
}

.legend-label {
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--text-secondary);
}

.legend-value {
	font-size: 0.875rem;
	font-weight: 700;
	color: var(--text-primary);
}

@media (max-width: 1024px) {
	.chart-stats {
		grid-template-columns: repeat(3, 1fr);
	}
}

@media (max-width: 768px) {
	.chart-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
	}

	.chart-stats {
		grid-template-columns: repeat(2, 1fr);
	}

	.chart-legend {
		flex-direction: column;
		gap: 0.75rem;
	}

	.legend-item {
		justify-content: flex-start;
	}
}
```

## Testing Checklist

### Unit Tests

- [ ] `chartData.ts` utility functions generate correct data
- [ ] Time range selector updates chart data correctly
- [ ] Statistics calculations are accurate
- [ ] Component renders without errors

### Integration Tests

- [ ] Market page loads with ApexChart
- [ ] Data flows correctly from contract to chart
- [ ] Time range switching works
- [ ] Chart updates on prop changes
- [ ] Responsive design works on mobile

### Visual Tests

- [ ] Dark theme styling matches app
- [ ] Colors align with YES/NO scheme
- [ ] Tooltips display correctly
- [ ] Legends are legible
- [ ] Animations are smooth

### Performance Tests

- [ ] Chart renders quickly (< 500ms)
- [ ] No memory leaks after unmount
- [ ] Efficient re-renders on data updates
- [ ] No console errors/warnings

## Migration Path

### Backward Compatibility

- Keep `PriceChart.svelte` component intact (not deleted)
- Add comment indicating deprecation
- ApexMarketChart will now use ApexPriceChart

### Rollback Strategy

If issues arise:

1. Revert `ApexMarketChart.svelte` to use `PriceChart`
2. Delete new `chartData.ts` file
3. Rollback `ApexPriceChart.svelte` changes

## Benefits of ApexCharts Integration

1. **Rich Feature Set**: Built-in zooming, panning, annotations
2. **Better Performance**: Optimized rendering for large datasets
3. **Consistency**: Same library used across multiple chart types
4. **Accessibility**: Better keyboard navigation and screen reader support
5. **Customization**: Extensive theming and configuration options
6. **Responsiveness**: Built-in responsive behavior
7. **Community**: Large user base and documentation

## Future Enhancements

### Phase 2 (Post-Implementation)

1. Add real-time data updates with WebSocket
2. Implement candlestick chart toggle
3. Add comparison chart (multi-market)
4. Export chart as image/PDF
5. Add volume histogram overlay
6. Implement advanced indicators (MA, RSI, Bollinger Bands)
7. Add drawing tools for annotations
8. Create market comparison dashboard

### Phase 3 (Long-term)

1. Add technical analysis indicators
2. Create chart templates/presets
3. Implement custom chart types (box plot, heatmap)
4. Add machine learning predictions overlay
5. Create chart sharing feature
6. Add chart analytics and insights

## Files to Modify

### Primary Changes

1. `src/lib/components/ApexMarketChart.svelte` - Main integration
2. New file: `src/lib/utils/chartData.ts` - Data generation utility

### Optional Enhancements

3. `src/lib/components/ApexPriceChart.svelte` - Improve configuration
4. New file: `src/lib/components/ApexVolumeChart.svelte` - Volume chart

### Testing

5. New file: `src/tests/chartData.test.ts` - Utility tests
6. New file: `src/tests/components/ApexMarketChart.test.ts` - Component tests

## Estimated Timeline

- **Phase 1**: 2-3 hours (Update ApexMarketChart)
- **Phase 2**: 1-2 hours (Create chartData utility)
- **Phase 3**: 1-2 hours (Enhance ApexPriceChart)
- **Phase 4**: 2-3 hours (Optional: Volume chart)
- **Testing**: 2-3 hours (Unit, integration, visual)
- **Total**: 8-13 hours

## Success Criteria

1. ✅ ApexCharts displays correctly on individual market pages
2. ✅ Price history data is accurate and properly formatted
3. ✅ Time range selector works (1D, 7D, 30D, All)
4. ✅ Statistics display correctly (current prices, high, low, 24h change)
5. ✅ Responsive design works on mobile and desktop
6. ✅ Dark theme styling matches application design
7. ✅ No console errors or warnings
8. ✅ Performance is acceptable (< 500ms initial render)
9. ✅ Code follows project conventions (Svelte 5 runes, TypeScript)
10. ✅ Tests pass (lint, typecheck, unit tests)

## Notes

- ApexCharts is already installed (v5.3.6)
- `ApexChart.svelte` wrapper already uses Svelte 5 runes (`$props`, `$effect`)
- `ApexPriceChart.svelte` already exists and is well-implemented
- Main work is integrating existing components into the market page flow
- Consider removing `PriceChart.svelte` after successful implementation (after 2 weeks of production use)
