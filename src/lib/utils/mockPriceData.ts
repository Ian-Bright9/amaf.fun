import type {
	ChartData,
	ChartStats,
	PriceDataPoint,
	CandlestickDataPoint
} from '../../types/index.js';

function generateRandomPrice(
	initialPrice: number,
	volatility: number,
	min: number,
	max: number
): number {
	const change = (Math.random() - 0.5) * volatility;
	const newPrice = initialPrice + change;
	return Math.max(min, Math.min(max, newPrice));
}

export function generatePriceHistory(days: number = 7): PriceDataPoint[] {
	const points: PriceDataPoint[] = [];
	const hoursPerDay = 24;
	const totalPoints = days * hoursPerDay;
	const now = Date.now();
	const msPerHour = 3600000;

	let yesPrice = 0.5;
	const volatility = 0.05;

	for (let i = totalPoints; i >= 0; i--) {
		const timestamp = now - i * msPerHour;
		yesPrice = generateRandomPrice(yesPrice, volatility, 0.01, 0.99);
		const noPrice = 1 - yesPrice;

		points.push({
			timestamp,
			yesPrice,
			noPrice
		});
	}

	return points;
}

export function generateCandlestickData(priceHistory: PriceDataPoint[]): CandlestickDataPoint[] {
	const candlesticks: CandlestickDataPoint[] = [];
	const hoursPerCandle = 1;

	for (let i = 0; i < priceHistory.length; i += hoursPerCandle) {
		const chunk = priceHistory.slice(i, i + hoursPerCandle);

		if (chunk.length === 0) continue;

		const open = chunk[0].yesPrice;
		const close = chunk[chunk.length - 1].yesPrice;
		const high = Math.max(...chunk.map((p) => p.yesPrice));
		const low = Math.min(...chunk.map((p) => p.yesPrice));

		const timestamp = chunk[0].timestamp;
		const date = new Date(timestamp);

		candlesticks.push({
			timestamp,
			x: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`,
			y: [open, high, low, close]
		});
	}

	return candlesticks;
}

export function calculateStats(priceHistory: PriceDataPoint[]): ChartStats {
	if (priceHistory.length === 0) {
		return {
			currentYes: 0,
			currentNo: 0,
			high: 0,
			low: 0,
			change24h: 0,
			volume: 0
		};
	}

	const latest = priceHistory[priceHistory.length - 1];
	const yesPrices = priceHistory.map((p) => p.yesPrice);
	const high = Math.max(...yesPrices);
	const low = Math.min(...yesPrices);

	const msPer24h = 86400000;
	const currentYes = latest.yesPrice;
	const currentNo = latest.noPrice;

	let change24h = 0;
	const point24hAgo = priceHistory.find((p) => latest.timestamp - p.timestamp >= msPer24h);
	if (point24hAgo) {
		change24h = ((currentYes - point24hAgo.yesPrice) / point24hAgo.yesPrice) * 100;
	}

	const volume = Math.random() * 10000;

	return {
		currentYes,
		currentNo,
		high,
		low,
		change24h,
		volume
	};
}

export function generateChartData(days: number = 7): ChartData {
	const priceHistory = generatePriceHistory(days);
	const candlestick = generateCandlestickData(priceHistory);
	const stats = calculateStats(priceHistory);

	return {
		title: 'Price History',
		prices: priceHistory,
		candlestick,
		stats
	};
}
