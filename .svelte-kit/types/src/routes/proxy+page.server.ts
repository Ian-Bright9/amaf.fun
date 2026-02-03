// @ts-nocheck
import type { ServerLoad } from '@sveltejs/kit';
import { getContracts } from '$lib/api/contracts.js';
import type { MarketData } from '../types/index.js';

export const load = async ({ fetch }: Parameters<ServerLoad>[0]) => {
	try {
		const contracts = await getContracts(fetch);

		if (!contracts || contracts.length === 0) {
			return {
				markets: [],
				error: null
			};
		}

		const markets: MarketData[] = contracts.map((contract) => ({
			contract,
			yesPrice: contract.yesPrice,
			noPrice: contract.noPrice,
			volume: contract.totalVolume,
			bets: []
		}));

		return {
			markets,
			error: null
		};
	} catch (error) {
		console.error('Error loading page data:', error);
		return {
			markets: [],
			error: error instanceof Error ? error.message : 'Failed to load markets'
		};
	}
};
