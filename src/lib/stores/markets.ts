import { writable, derived, type Readable } from 'svelte/store';
import type { MarketData } from '../../types/index.js';

const createMarketsStore = () => {
	const { subscribe, set, update } = writable<{
		markets: MarketData[];
		loading: boolean;
		error: string | null;
	}>({
		markets: [],
		loading: false,
		error: null
	});

	return {
		subscribe,
		setMarkets: (markets: MarketData[]) => update((state) => ({ ...state, markets })),
		addMarket: (market: MarketData) =>
			update((state) => ({ ...state, markets: [...state.markets, market] })),
		updateMarket: (contractId: string, updates: Partial<MarketData>) =>
			update((state) => ({
				...state,
				markets: state.markets.map((m) => (m.contract.id === contractId ? { ...m, ...updates } : m))
			})),
		setLoading: (loading: boolean) => update((state) => ({ ...state, loading })),
		setError: (error: string | null) => update((state) => ({ ...state, error })),
		reset: () => set({ markets: [], loading: false, error: null })
	};
};

export const marketsStore = createMarketsStore();

export const activeMarkets: Readable<MarketData[]> = derived(marketsStore, ($marketsStore) =>
	$marketsStore.markets.filter((m) => m.contract.status === 'active')
);
