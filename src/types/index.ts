export interface Contract {
	id: string;
	question: string;
	description?: string;
	creator: string;
	authority: string;
	resolution: 'yes' | 'no' | 'pending';
	status: 'active' | 'resolved' | 'cancelled';
	createdAt: string;
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
}

export type WalletAdapter = {
	publicKey: { toBase58: () => string } | null;
	signTransaction: (transaction: any) => Promise<any>;
	signAllTransactions: (transactions: any[]) => Promise<any[]>;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	sendTransaction: (transaction: any) => Promise<string>;
};
