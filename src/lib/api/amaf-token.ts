import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { signAndSendTransaction } from '$lib/utils/wallet.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';

const AMAF_TOKEN_MINT = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');

export async function claimDailyTokens(
	connection: Connection,
	walletAdapter: any
): Promise<{ transaction: Transaction; signature: string | null }> {
	try {
		const { blockhash } = await connection.getLatestBlockhash();

		const transaction = new Transaction();
		transaction.recentBlockhash = blockhash;
		transaction.feePayer = walletAdapter.publicKey;

		const claimInstruction = {
			keys: [
				{
					pubkey: PROGRAM_ID,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: walletAdapter.publicKey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: PROGRAM_ID,
			data: Buffer.from([1])
		};

		transaction.add(claimInstruction);

		const signature = await signAndSendTransaction(transaction, walletAdapter, connection);

		return { transaction, signature };
	} catch (error) {
		console.error('Error claiming daily tokens:', error);
		throw error instanceof Error ? error : new Error('Failed to claim daily tokens');
	}
}

export async function getAmafMintInfo(connection: Connection): Promise<{
	mint: PublicKey;
	authority: PublicKey;
	decimals: number;
}> {
	try {
		const accountInfo = await connection.getAccountInfo(AMAF_TOKEN_MINT);

		if (!accountInfo || !accountInfo.data) {
			throw new Error('Token mint not found. Please initialize first.');
		}

		const data = accountInfo.data;
		const authority = new PublicKey(data.slice(0, 32));
		const decimals = data.slice(44, 45)[0];

		return {
			mint: AMAF_TOKEN_MINT,
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
		const tokenStateSeeds = [Buffer.from('token_state'), publicKey.toBuffer()];

		const [tokenStateAddress] = PublicKey.findProgramAddressSync(tokenStateSeeds, PROGRAM_ID);

		const accountInfo = await connection.getAccountInfo(tokenStateAddress);

		if (!accountInfo) {
			return { canClaim: true, lastClaimTime: null };
		}

		const data = accountInfo.data;
		const lastClaimTime = Number(data.readBigUInt64LE(32));

		const currentTime = Math.floor(Date.now() / 1000);
		const timeSinceClaim = currentTime - lastClaimTime;
		const canClaim = timeSinceClaim >= 24 * 60 * 60;

		return { canClaim, lastClaimTime };
	} catch (error) {
		console.error('Error checking claim eligibility:', error);
		return { canClaim: true, lastClaimTime: null };
	}
}
