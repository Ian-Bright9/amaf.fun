import type { Market, Bet, WalletState } from '../../types/index.js';

export const mockPublicKeys = {
	creator: 'CreatorWallet111111111111111111111111',
	user1: 'UserWallet111111111111111111111111111',
	user2: 'UserWallet222222222222222222222222222',
	authority: 'AuthWallet1111111111111111111111111',
	programId: 'FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE'
};

export const mockMarkets: Record<string, Market> = {
	activeMarket: {
		id: 'MarketActive111111111111111111111111',
		question: 'Will Bitcoin reach $100k by end of 2025?',
		description: 'Betting on BTC price milestone',
		creator: mockPublicKeys.creator,
		authority: mockPublicKeys.authority,
		resolution: 'pending',
		status: 'active',
		createdAt: '2025-01-20T00:00:00Z',
		resolvesAt: '2025-12-31T23:59:59Z',
		resolved: false,
		totalYes: 5000,
		totalNo: 3000,
		totalVolume: 8000,
		yesPrice: 0.625,
		noPrice: 0.375,
		currentYesPrice: 0.625,
		currentNoPrice: 0.375
	},
	resolvedMarketYes: {
		id: 'MarketResolvedYes1111111111111111111',
		question: 'Will it rain tomorrow?',
		description: 'Weather prediction',
		creator: mockPublicKeys.creator,
		authority: mockPublicKeys.authority,
		resolution: 'yes',
		status: 'resolved',
		createdAt: '2025-01-19T00:00:00Z',
		resolvesAt: '2025-01-20T00:00:00Z',
		resolved: true,
		outcome: true,
		totalYes: 7000,
		totalNo: 2000,
		totalVolume: 9000,
		yesPrice: 0.778,
		noPrice: 0.222,
		currentYesPrice: 1,
		currentNoPrice: 0
	},
	resolvedMarketNo: {
		id: 'MarketResolvedNo111111111111111111111',
		question: 'Will Ethereum flip Bitcoin?',
		description: 'Market cap comparison',
		creator: mockPublicKeys.user1,
		authority: mockPublicKeys.user1,
		resolution: 'no',
		status: 'resolved',
		createdAt: '2025-01-18T00:00:00Z',
		resolvesAt: '2025-01-20T00:00:00Z',
		resolved: true,
		outcome: false,
		totalYes: 1000,
		totalNo: 9000,
		totalVolume: 10000,
		yesPrice: 0.1,
		noPrice: 0.9,
		currentYesPrice: 0,
		currentNoPrice: 1
	},
	cancelledMarket: {
		id: 'MarketCancelled111111111111111111111',
		question: 'Will AI solve P=NP?',
		description: 'Mathematics breakthrough',
		creator: mockPublicKeys.user2,
		authority: mockPublicKeys.user2,
		resolution: 'pending',
		status: 'cancelled',
		createdAt: '2025-01-19T12:00:00Z',
		resolvesAt: '2025-12-31T23:59:59Z',
		resolved: true,
		totalYes: 0,
		totalNo: 0,
		totalVolume: 0,
		yesPrice: 0.5,
		noPrice: 0.5,
		currentYesPrice: 0.5,
		currentNoPrice: 0.5
	}
};

export const mockBets: Record<string, Bet> = {
	winningYesBet: {
		id: 'BetWinningYes111111111111111111111111',
		contractId: mockMarkets.resolvedMarketYes.id,
		marketId: mockMarkets.resolvedMarketYes.id,
		user: mockPublicKeys.user1,
		amount: 100,
		position: 'yes',
		sideYes: true,
		odds: 0.778,
		claimed: false,
		timestamp: '2025-01-19T01:00:00Z'
	},
	losingNoBet: {
		id: 'BetLosingNo11111111111111111111111111',
		contractId: mockMarkets.resolvedMarketYes.id,
		marketId: mockMarkets.resolvedMarketYes.id,
		user: mockPublicKeys.user2,
		amount: 50,
		position: 'no',
		sideYes: false,
		odds: 0.222,
		claimed: false,
		timestamp: '2025-01-19T02:00:00Z'
	},
	winningNoBet: {
		id: 'BetWinningNo11111111111111111111111111',
		contractId: mockMarkets.resolvedMarketNo.id,
		marketId: mockMarkets.resolvedMarketNo.id,
		user: mockPublicKeys.user1,
		amount: 200,
		position: 'no',
		sideYes: false,
		odds: 0.9,
		claimed: false,
		timestamp: '2025-01-18T10:00:00Z'
	},
	claimedyesBet: {
		id: 'BetClaimedYes1111111111111111111111111',
		contractId: mockMarkets.resolvedMarketYes.id,
		marketId: mockMarkets.resolvedMarketYes.id,
		user: mockPublicKeys.user1,
		amount: 100,
		position: 'yes',
		sideYes: true,
		odds: 0.778,
		claimed: true,
		timestamp: '2025-01-19T01:00:00Z'
	},
	activeMarketBet: {
		id: 'BetActiveMarket11111111111111111111111',
		contractId: mockMarkets.activeMarket.id,
		marketId: mockMarkets.activeMarket.id,
		user: mockPublicKeys.user1,
		amount: 150,
		position: 'yes',
		sideYes: true,
		odds: 0.625,
		claimed: false,
		timestamp: '2025-01-20T00:00:00Z'
	}
};

export const mockWalletStates: Record<string, WalletState> = {
	connectedWallet: {
		publicKey: mockPublicKeys.user1,
		connected: true,
		balance: 10.5,
		amafBalance: 1500,
		lastClaimTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
		lastClaim: Date.now() - 25 * 60 * 60 * 1000
	},
	freshWallet: {
		publicKey: mockPublicKeys.user2,
		connected: true,
		balance: 5.0,
		amafBalance: 0,
		lastClaimTime: null,
		lastClaim: null
	},
	recentlyClaimedWallet: {
		publicKey: mockPublicKeys.creator,
		connected: true,
		balance: 20.0,
		amafBalance: 2000,
		lastClaimTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		lastClaim: Date.now() - 2 * 60 * 60 * 1000
	},
	disconnectedWallet: {
		publicKey: null,
		connected: false,
		balance: 0,
		amafBalance: 0,
		lastClaimTime: null,
		lastClaim: null
	}
};

export const mockMarketDataBuffers = {
	activeMarket: createMockMarketBuffer(mockMarkets.activeMarket),
	resolvedYesMarket: createMockMarketBuffer(mockMarkets.resolvedMarketYes),
	resolvedNoMarket: createMockMarketBuffer(mockMarkets.resolvedMarketNo),
	cancelledMarket: createMockMarketBuffer(mockMarkets.cancelledMarket)
};

export const mockBetDataBuffers = {
	winningYesBet: createMockBetBuffer(mockBets.winningYesBet),
	losingNoBet: createMockBetBuffer(mockBets.losingNoBet),
	activeBet: createMockBetBuffer(mockBets.activeMarketBet)
};

function createMockMarketBuffer(market: Market): Buffer {
	const discriminator = Buffer.alloc(8);
	discriminator.fill(0);

	const authority = Buffer.from(mockPublicKeys.authority, 'base64').slice(0, 32);
	const questionLength = Buffer.alloc(4);
	questionLength.writeUInt32LE(market.question.length, 0);
	const question = Buffer.from(market.question, 'utf8');
	const descriptionLength = Buffer.alloc(4);
	descriptionLength.writeUInt32LE((market.description || '').length, 0);
	const description = Buffer.from(market.description || '', 'utf8');

	const resolved = Buffer.alloc(1);
	resolved.writeUInt8(market.resolved ? 1 : 0, 0);

	const outcome = Buffer.alloc(1);
	if (market.outcome !== undefined) {
		outcome.writeUInt8(market.outcome ? 1 : 0, 0);
	}

	const totalYes = Buffer.alloc(8);
	totalYes.writeBigUInt64LE(BigInt(market.totalYes), 0);

	const totalNo = Buffer.alloc(8);
	totalNo.writeBigUInt64LE(BigInt(market.totalNo), 0);

	const bump = Buffer.alloc(1);
	bump.writeUInt8(255, 0);

	const padding = Buffer.alloc(8);

	return Buffer.concat([
		discriminator,
		authority,
		questionLength,
		question,
		descriptionLength,
		description,
		resolved,
		outcome,
		totalYes,
		totalNo,
		bump,
		padding
	]);
}

function createMockBetBuffer(bet: Bet): Buffer {
	const discriminator = Buffer.alloc(8);
	discriminator.fill(0);

	const market = Buffer.from(bet.marketId, 'base64').slice(0, 32);
	const user = Buffer.from(bet.user, 'base64').slice(0, 32);

	const amount = Buffer.alloc(8);
	amount.writeBigUInt64LE(BigInt(bet.amount), 0);

	const sideYes = Buffer.alloc(1);
	sideYes.writeUInt8(bet.sideYes ? 1 : 0, 0);

	const claimed = Buffer.alloc(1);
	claimed.writeUInt8(bet.claimed ? 1 : 0, 0);

	const bump = Buffer.alloc(1);
	bump.writeUInt8(255, 0);

	return Buffer.concat([discriminator, market, user, amount, sideYes, claimed, bump]);
}

export const mockAccountInfos = {
	marketAccount: {
		lamports: 1000000,
		data: mockMarketDataBuffers.activeMarket,
		owner: mockPublicKeys.programId,
		executable: false
	},
	betAccount: {
		lamports: 500000,
		data: mockBetDataBuffers.activeBet,
		owner: mockPublicKeys.programId,
		executable: false
	}
};

export function getMockMarketById(id: string): Market | undefined {
	return Object.values(mockMarkets).find((m) => m.id === id);
}

export function getMockBetById(id: string): Bet | undefined {
	return Object.values(mockBets).find((b) => b.id === id);
}

export function getBetsForMarket(marketId: string): Bet[] {
	return Object.values(mockBets).filter((b) => b.marketId === marketId);
}

export function getBetsForUser(user: string): Bet[] {
	return Object.values(mockBets).filter((b) => b.user === user);
}
