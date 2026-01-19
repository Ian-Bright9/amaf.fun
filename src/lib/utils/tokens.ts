import { Connection, PublicKey } from '@solana/web3.js';

export const AMAF_TOKEN_MINT = new PublicKey('placeholder_mint_address');

export async function getAmafBalance(
	connection: Connection,
	publicKey: PublicKey
): Promise<number> {
	try {
		const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
			mint: AMAF_TOKEN_MINT
		});

		if (tokenAccounts.value.length === 0) {
			return 0;
		}

		const firstAccount = tokenAccounts.value[0];
		const balance = firstAccount.account.data.parsed.info.tokenAmount.uiAmount;
		return balance || 0;
	} catch (error) {
		console.error('Error fetching AMAF balance:', error);
		return 0;
	}
}

export async function getAmafTokenAccount(
	connection: Connection,
	publicKey: PublicKey
): Promise<PublicKey | null> {
	try {
		const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
			mint: AMAF_TOKEN_MINT
		});

		if (tokenAccounts.value.length === 0) {
			return null;
		}

		return tokenAccounts.value[0].pubkey;
	} catch (error) {
		console.error('Error fetching AMAF token account:', error);
		return null;
	}
}

export async function getAmafTokenSupply(connection: Connection): Promise<number> {
	try {
		const supply = await connection.getTokenSupply(AMAF_TOKEN_MINT);
		return supply.value.uiAmount || 0;
	} catch (error) {
		console.error('Error fetching AMAF token supply:', error);
		return 0;
	}
}
