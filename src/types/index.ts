export interface Market {
	id: string;
	question: string;
	description?: string;
	creator: string;
	authority: string;
	resolution: 'yes' | 'no' | 'pending';
	status: 'active' | 'resolved' | 'cancelled';
	createdAt: string;
	resolvesAt: string;
	resolved: boolean;
	outcome?: boolean;
	totalYes: number;
	totalNo: number;
	// Calculated fields
	totalVolume: number;
	yesPrice: number;
	noPrice: number;
	currentYesPrice: number;
	currentNoPrice: number;
	expirationTimestamp?: number;
	betCount?: number;
}

export type Contract = Market;

export interface Bet {
	id: string;
	contractId: string;
	marketId: string;
	user: string;
	amount: number;
	position: 'yes' | 'no';
	sideYes: boolean;
	odds: number;
	claimed: boolean;
	timestamp?: string;
}

export interface MarketData {
	contract: Contract;
	yesPrice: number;
	noPrice: number;
	volume: number;
	bets: Bet[];
}

export interface WalletState {
	publicKey: string | null;
	connected: boolean;
	balance: number;
	amafBalance: number;
	lastClaimTime: string | null;
	lastClaim: number | null;
}

export type WalletAdapter = {
	publicKey: { toBase58: () => string } | null;
	signTransaction: (transaction: any) => Promise<any>;
	signAllTransactions: (transactions: any[]) => Promise<any[]>;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	sendTransaction: (transaction: any) => Promise<string>;
};

export interface DailyClaimState {
	user: string;
	lastClaim: number;
}

export interface AmafTokenBalance {
	balance: number;
	canClaim: boolean;
	nextClaimTime?: Date;
}

export interface PriceDataPoint {
	timestamp: number;
	yesPrice: number;
	noPrice: number;
}

export interface ChartStats {
	currentYes: number;
	currentNo: number;
	high: number;
	low: number;
	change24h: number;
	volume: number;
}

export interface CandlestickDataPoint {
	timestamp: number;
	x: string;
	y: [number, number, number, number];
}

export interface ChartData {
	title: string;
	prices: PriceDataPoint[];
	candlestick?: CandlestickDataPoint[];
	stats: ChartStats;
}

export interface ChartOptions {
	colors: {
		yes: string;
		no: string;
		background: string;
		grid: string;
		text: string;
		tooltip: string;
	};
	responsive: boolean;
}
