import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');

export const SOLANA_NETWORKS = {
	devnet: 'https://api.devnet.solana.com',
	testnet: 'https://api.testnet.solana.com',
	mainnet: 'https://api.mainnet-beta.solana.com',
	localnet: 'http://localhost:8899'
} as const;

export const DEFAULT_NETWORK = SOLANA_NETWORKS.devnet;
