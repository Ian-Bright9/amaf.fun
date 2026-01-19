import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';
import { deriveTokenStateAddress } from '$lib/utils/pda.js';
import idl from '$lib/idl/amafcoin.json';

const CLAIM_COOLDOWN_SECONDS = 24 * 60 * 60;

export async function getAmafMintInfo(
	connection: Connection,
	tokenMint: PublicKey
): Promise<{
	mint: PublicKey;
	authority: PublicKey;
	decimals: number;
}> {
	try {
		const accountInfo = await connection.getAccountInfo(tokenMint);

		if (!accountInfo || !accountInfo.data) {
			throw new Error('Token mint not found. Please initialize first.');
		}

		const data = accountInfo.data;
		const authority = new PublicKey(data.slice(0, 32));
		const decimals = data.slice(44, 45)[0];

		return {
			mint: tokenMint,
			authority,
			decimals
		};
	} catch (error) {
		console.error('Error getting token mint info:', error);
		throw error instanceof Error ? error : new Error('Failed to get token mint info');
	}
}

export async function checkCanClaim(
	connection: Connection,
	publicKey: PublicKey
): Promise<{ canClaim: boolean; lastClaimTime: number | null }> {
	try {
		const tokenStateAddress = deriveTokenStateAddress();

		const accountInfo = await connection.getAccountInfo(tokenStateAddress);

		if (!accountInfo || !accountInfo.data) {
			return { canClaim: true, lastClaimTime: null };
		}

		const data = accountInfo.data;
		const authority = new PublicKey(data.slice(0, 32));
		const lastClaimTime = Number(data.slice(32, 40).readBigInt64LE());
		const totalClaimed = Number(data.slice(40, 48).readBigUInt64LE());

		const currentTime = Math.floor(Date.now() / 1000);
		const timeSinceClaim = currentTime - lastClaimTime;
		const canClaim = timeSinceClaim >= CLAIM_COOLDOWN_SECONDS;

		return { canClaim, lastClaimTime };
	} catch (error) {
		console.error('Error checking claim eligibility:', error);
		return { canClaim: true, lastClaimTime: null };
	}
}
