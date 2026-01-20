import { describe, it, expect, beforeEach } from 'vitest';
import { marketsStore, activeMarkets } from '$lib/stores/markets.js';
import type { MarketData } from '../../types/index.js';

describe('marketsStore', () => {
	let mockMarket: MarketData;

	beforeEach(() => {
		mockMarket = {
			contract: {
				id: 'test-contract-1',
				question: 'Will it rain tomorrow?',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				resolved: false,
				totalYes: 0,
				totalNo: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			},
			yesPrice: 0.5,
			noPrice: 0.5,
			volume: 0,
			bets: []
		};

		marketsStore.reset();
	});

	it('initializes with empty state', () => {
		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets).toEqual([]);
		expect(state.loading).toBe(false);
		expect(state.error).toBeNull();
	});

	it('adds a market', () => {
		marketsStore.addMarket(mockMarket);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets).toHaveLength(1);
		expect(state.markets[0].contract.id).toBe('test-contract-1');
	});

	it('updates a market', () => {
		marketsStore.addMarket(mockMarket);
		marketsStore.updateMarket('test-contract-1', { yesPrice: 0.6, noPrice: 0.4 });

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets[0].yesPrice).toBe(0.6);
		expect(state.markets[0].noPrice).toBe(0.4);
	});

	it('sets loading state', () => {
		marketsStore.setLoading(true);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.loading).toBe(true);
	});

	it('sets error state', () => {
		marketsStore.setError('Failed to fetch');

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.error).toBe('Failed to fetch');
	});

	it('resets to initial state', () => {
		marketsStore.addMarket(mockMarket);
		marketsStore.setError('Error');
		marketsStore.setLoading(true);

		marketsStore.reset();

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets).toEqual([]);
		expect(state.loading).toBe(false);
		expect(state.error).toBeNull();
	});

	it('replaces all markets with setMarkets', () => {
		marketsStore.addMarket(mockMarket);

		const newMarkets = [
			{
				...mockMarket,
				contract: { ...mockMarket.contract, id: 'new-market-1' }
			},
			{
				...mockMarket,
				contract: { ...mockMarket.contract, id: 'new-market-2' }
			}
		];

		marketsStore.setMarkets(newMarkets);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets).toHaveLength(2);
		expect(state.markets[0].contract.id).toBe('new-market-1');
		expect(state.markets[1].contract.id).toBe('new-market-2');
	});

	it('handles multiple updates to same market', () => {
		marketsStore.addMarket(mockMarket);
		marketsStore.updateMarket('test-contract-1', { yesPrice: 0.6 });
		marketsStore.updateMarket('test-contract-1', { noPrice: 0.4 });
		marketsStore.updateMarket('test-contract-1', { volume: 1000 });

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets[0].yesPrice).toBe(0.6);
		expect(state.markets[0].noPrice).toBe(0.4);
		expect(state.markets[0].volume).toBe(1000);
	});

	it('does not affect other markets when updating one', () => {
		marketsStore.addMarket(mockMarket);
		marketsStore.addMarket({
			...mockMarket,
			contract: { ...mockMarket.contract, id: 'test-contract-2' }
		});

		marketsStore.updateMarket('test-contract-1', { yesPrice: 0.9 });

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets[0].yesPrice).toBe(0.9);
		expect(state.markets[1].yesPrice).toBe(0.5);
	});

	it('clears error when setError is called with null', () => {
		marketsStore.setError('Error message');
		marketsStore.setError(null);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.error).toBeNull();
	});
});

describe('loading', () => {
	let mockMarket: MarketData;

	beforeEach(() => {
		mockMarket = {
			contract: {
				id: 'test-contract-1',
				question: 'Will it rain tomorrow?',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				resolved: false,
				totalYes: 0,
				totalNo: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			},
			yesPrice: 0.5,
			noPrice: 0.5,
			volume: 0,
			bets: []
		};

		marketsStore.reset();
	});

	it('should set loading to true while fetching', () => {
		marketsStore.setLoading(true);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.loading).toBe(true);
	});

	it('should set loading to false after fetch', () => {
		marketsStore.setLoading(true);
		marketsStore.addMarket(mockMarket);
		marketsStore.setLoading(false);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.loading).toBe(false);
		expect(state.markets).toHaveLength(1);
	});

	it('should set loading to false on error', () => {
		marketsStore.setLoading(true);
		marketsStore.setError('Fetch failed');
		marketsStore.setLoading(false);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.loading).toBe(false);
		expect(state.error).toBe('Fetch failed');
	});

	it('should toggle loading state', () => {
		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));

		marketsStore.setLoading(true);
		expect(state.loading).toBe(true);

		marketsStore.setLoading(false);
		expect(state.loading).toBe(false);

		unsubscribe();
	});
});

describe('error handling', () => {
	let mockMarket: MarketData;

	beforeEach(() => {
		mockMarket = {
			contract: {
				id: 'test-contract-1',
				question: 'Will it rain tomorrow?',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				resolved: false,
				totalYes: 0,
				totalNo: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			},
			yesPrice: 0.5,
			noPrice: 0.5,
			volume: 0,
			bets: []
		};

		marketsStore.reset();
	});

	it('should set error message on fetch failure', () => {
		marketsStore.setError('Failed to fetch markets');

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.error).toBe('Failed to fetch markets');
	});

	it('should clear error on successful fetch', () => {
		marketsStore.setError('Previous error');
		marketsStore.addMarket(mockMarket);
		marketsStore.setError(null);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.error).toBeNull();
	});

	it('should handle network errors', () => {
		marketsStore.setError('Network error: Connection timeout');

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.error).toBe('Network error: Connection timeout');
	});

	it('should handle deserialization errors', () => {
		marketsStore.setError('Deserialization error: Invalid data format');

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.error).toBe('Deserialization error: Invalid data format');
	});

	it('should maintain error across operations until cleared', () => {
		marketsStore.setError('Error occurred');

		marketsStore.addMarket(mockMarket);
		marketsStore.setLoading(false);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.error).toBe('Error occurred');
	});
});

describe('real-time updates', () => {
	let mockMarket1: MarketData;
	let mockMarket2: MarketData;

	beforeEach(() => {
		mockMarket1 = {
			contract: {
				id: 'test-contract-1',
				question: 'Will it rain tomorrow?',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				resolved: false,
				totalYes: 0,
				totalNo: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			},
			yesPrice: 0.5,
			noPrice: 0.5,
			volume: 0,
			bets: []
		};

		mockMarket2 = {
			contract: {
				id: 'test-contract-2',
				question: 'Will snow fall?',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				resolved: false,
				totalYes: 0,
				totalNo: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			},
			yesPrice: 0.5,
			noPrice: 0.5,
			volume: 0,
			bets: []
		};

		marketsStore.reset();
	});

	it('should update market when account changes', () => {
		marketsStore.addMarket(mockMarket1);
		marketsStore.updateMarket('test-contract-1', { yesPrice: 0.75, volume: 500 });

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets[0].yesPrice).toBe(0.75);
		expect(state.markets[0].volume).toBe(500);
	});

	it('should add new market when account created', () => {
		marketsStore.addMarket(mockMarket1);
		marketsStore.addMarket(mockMarket2);

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets).toHaveLength(2);
		expect(state.markets[1].contract.id).toBe('test-contract-2');
	});

	it('should update multiple fields in one operation', () => {
		marketsStore.addMarket(mockMarket1);
		marketsStore.updateMarket('test-contract-1', {
			yesPrice: 0.7,
			noPrice: 0.3,
			volume: 1000,
			bets: [
				{
					id: 'bet-1',
					contractId: 'test-contract-1',
					marketId: 'test-contract-1',
					user: 'user-1',
					amount: 100,
					position: 'yes',
					sideYes: true,
					odds: 1.5,
					claimed: false
				}
			]
		});

		let state: any;
		const unsubscribe = marketsStore.subscribe((s) => (state = s));
		unsubscribe();

		expect(state.markets[0].yesPrice).toBe(0.7);
		expect(state.markets[0].noPrice).toBe(0.3);
		expect(state.markets[0].volume).toBe(1000);
		expect(state.markets[0].bets).toHaveLength(1);
	});
});

describe('activeMarkets derived store', () => {
	let activeMarket: MarketData;
	let resolvedMarket: MarketData;
	let cancelledMarket: MarketData;

	beforeEach(() => {
		activeMarket = {
			contract: {
				id: 'active-market',
				question: 'Active market',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				resolved: false,
				totalYes: 0,
				totalNo: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			},
			yesPrice: 0.5,
			noPrice: 0.5,
			volume: 0,
			bets: []
		};

		resolvedMarket = {
			contract: {
				id: 'resolved-market',
				question: 'Resolved market',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'yes',
				status: 'resolved',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() - 86400000).toISOString(),
				resolved: true,
				totalYes: 100,
				totalNo: 0,
				totalVolume: 100,
				yesPrice: 1,
				noPrice: 0,
				currentYesPrice: 1,
				currentNoPrice: 0
			},
			yesPrice: 1,
			noPrice: 0,
			volume: 100,
			bets: []
		};

		cancelledMarket = {
			contract: {
				id: 'cancelled-market',
				question: 'Cancelled market',
				creator: 'test-creator',
				authority: 'test-creator',
				resolution: 'pending',
				status: 'cancelled',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				resolved: false,
				totalYes: 0,
				totalNo: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			},
			yesPrice: 0.5,
			noPrice: 0.5,
			volume: 0,
			bets: []
		};

		marketsStore.reset();
	});

	it('should return only active markets', () => {
		marketsStore.addMarket(activeMarket);
		marketsStore.addMarket(resolvedMarket);
		marketsStore.addMarket(cancelledMarket);

		let active: MarketData[] = [];
		const unsubscribe = activeMarkets.subscribe((a) => {
			active = a;
		});
		unsubscribe();

		expect(active).toHaveLength(1);
		expect(active[0].contract.id).toBe('active-market');
	});

	it('should return empty array when no active markets', () => {
		marketsStore.addMarket(resolvedMarket);
		marketsStore.addMarket(cancelledMarket);

		let active: MarketData[] = [];
		const unsubscribe = activeMarkets.subscribe((a) => {
			active = a;
		});
		unsubscribe();

		expect(active).toEqual([]);
	});

	it('should update reactively when market status changes', () => {
		marketsStore.addMarket(activeMarket);
		marketsStore.addMarket(resolvedMarket);

		let active: MarketData[] = [];
		const unsubscribe = activeMarkets.subscribe((a) => {
			active = a;
		});

		expect(active).toHaveLength(1);

		marketsStore.updateMarket('active-market', {
			contract: { ...activeMarket.contract, status: 'resolved' }
		});

		expect(active).toHaveLength(0);

		unsubscribe();
	});
});
