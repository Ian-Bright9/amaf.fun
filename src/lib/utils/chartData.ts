import type { Contract, PriceDataPoint } from '../../types/index.js';

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
		ALL: 24 * 90
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
