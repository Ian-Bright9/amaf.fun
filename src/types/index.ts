export interface Contract {
	id: string;
	question: string;
	description?: string;
	creator: string;
	authority: string;
	resolution: 'yes' | 'no' | 'pending';
	status: 'active' | 'resolved' | 'cancelled';
	createdAt: string;
	resolvesAt: string;
	expirationTimestamp: number;
	resolved: boolean;
	outcome?: boolean;
	totalYesAmount: number;
	totalNoAmount: number;
	betCount: number;
	// Calculated fields
	totalVolume: number;
	yesPrice: number;
	noPrice: number;
	currentYesPrice: number;
	currentNoPrice: number;
}

export interface Bet {
	id: string;
	contractId: string;
	user: string;
	amount: number;
	position: 'yes' | 'no';
	timestamp: string;
	odds: number;
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
}

export type WalletAdapter = {
	publicKey: { toBase58: () => string } | null;
	signTransaction: (transaction: any) => Promise<any>;
	signAllTransactions: (transactions: any[]) => Promise<any[]>;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	sendTransaction: (transaction: any) => Promise<string>;
};

export interface TokenState {
	authority: string;
	lastClaimTime: number;
	totalClaimed: number;
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

export interface CandlestickDataPoint {
	timestamp: number;
	x: string;
	y: [number, number, number, number];
}

export interface ChartStats {
	currentYes: number;
	currentNo: number;
	high: number;
	low: number;
	change24h: number;
	volume: number;
}

export interface ChartData {
	prices: PriceDataPoint[];
	candlestick: CandlestickDataPoint[];
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
