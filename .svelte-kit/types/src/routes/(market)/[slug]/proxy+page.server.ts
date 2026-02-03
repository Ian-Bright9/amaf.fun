// @ts-nocheck
import type { ServerLoad } from '@sveltejs/kit';
import { getContract } from '../../../lib/api/contracts.js';
import type { Contract, Bet } from '../../../types/index.js';

export const load = async ({ params, fetch }: Parameters<ServerLoad>[0]) => {
	const slug = params.slug as string;
	try {
		const contract = await getContract(params.slug, fetch);

		// Mock bet data for now
		const mockBets: Bet[] = [
			{
				id: '1',
				contractId: params.slug,
				marketId: params.slug,
				user: '0x1234...5678',
				amount: 100,
				position: 'yes',
				sideYes: true,
				claimed: false,
				timestamp: new Date(Date.now() - 3600000).toISOString(),
				odds: 0.65
			},
			{
				id: '2',
				contractId: params.slug,
				marketId: params.slug,
				user: '0x8765...4321',
				amount: 50,
				position: 'no',
				sideYes: false,
				claimed: false,
				timestamp: new Date(Date.now() - 7200000).toISOString(),
				odds: 0.35
			}
		];

		return {
			contract,
			bets: mockBets,
			error: null
		};
	} catch (error) {
		return {
			contract: null,
			bets: [],
			error: error instanceof Error ? error.message : 'Market not found'
		};
	}
};
