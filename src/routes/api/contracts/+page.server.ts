import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export async function load() {
	try {
		const programId = new PublicKey(PROGRAM_ID);

		const accounts = await connection.getProgramAccounts(programId);

		if (accounts.length === 0) {
			return {
				contracts: [],
				error: 'No contracts found on chain. Deploy the program first.'
			};
		}

		return {
			contracts: [],
			error: null
		};
	} catch (error) {
		console.error('Error loading contracts:', error);
		return {
			contracts: [],
			error: error instanceof Error ? error.message : 'Failed to load contracts'
		};
	}
}
