import { Connection, PublicKey } from '@solana/web3.js';

export async function getAmafBalance(
	connection: Connection,
	publicKey: PublicKey,
	tokenMint: PublicKey
): Promise<number> {
	try {
		const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
			mint: tokenMint
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
	publicKey: PublicKey,
	tokenMint: PublicKey
): Promise<PublicKey | null> {
	try {
		const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
			mint: tokenMint
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

export async function getAmafTokenSupply(
	connection: Connection,
	tokenMint: PublicKey
): Promise<number> {
	try {
		const supply = await connection.getTokenSupply(tokenMint);
		return supply.value.uiAmount || 0;
	} catch (error) {
		console.error('Error fetching AMAF token supply:', error);
		return 0;
	}
}
