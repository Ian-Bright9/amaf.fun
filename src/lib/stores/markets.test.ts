import { describe, it, expect, beforeEach } from 'vitest';
import { marketsStore } from '$lib/stores/markets.js';
import type { MarketData } from '../../types/index.js';

describe('marketsStore', () => {
	let mockMarket: MarketData;

	beforeEach(() => {
		mockMarket = {
			contract: {
				id: 'test-contract-1',
				question: 'Will it rain tomorrow?',
				creator: 'test-creator',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 86400000).toISOString(),
				totalVolume: 0,
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
});
