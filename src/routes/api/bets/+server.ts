import type { RequestHandler } from '@sveltejs/kit';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import BN from 'bn.js';
import { PROGRAM_ID, DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
import {
	deriveTokenMintAddress,
	deriveEscrowTokenAddress,
	deriveUserTokenAccount
} from '$lib/utils/pda.js';
import idl from '$lib/idl/amafcoin.json';

const connection = new Connection(DEFAULT_NETWORK, 'confirmed');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { marketId, position, amount, user } = body;

		if (!marketId || !position || !amount || !user) {
			return new Response(
				JSON.stringify({
					error: 'Missing required fields: marketId, position, amount, user'
				}),
				{
					headers: { 'Content-Type': 'application/json' },
					status: 400
				}
			);
		}

		const marketPubkey = new PublicKey(marketId);
		const userPubkey = new PublicKey(user);
		const betKeypair = Keypair.generate();
		const tokenMint = deriveTokenMintAddress();
		const escrowToken = deriveEscrowTokenAddress(marketPubkey);
		const userToken = deriveUserTokenAccount(userPubkey, tokenMint);

		const betSize = 8 + 32 + 32 + 8 + 1 + 1;
		const rent = await connection.getMinimumBalanceForRentExemption(betSize);

		const provider = new anchor.AnchorProvider(
			connection,
			{
				publicKey: userPubkey,
				signTransaction: async (tx: any) => {
					return tx;
				},
				signAllTransactions: async (txs: any[]) => {
					return txs;
				}
			} as any,
			{ commitment: 'confirmed' }
		);

		const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

		const transaction = new Transaction();
		transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
		transaction.feePayer = userPubkey;

		transaction.add(
			SystemProgram.createAccount({
				fromPubkey: userPubkey,
				newAccountPubkey: betKeypair.publicKey,
				lamports: rent,
				space: betSize,
				programId: PROGRAM_ID
			})
		);

		const sideYes = position === 'yes';

		transaction.add(
			program.instruction.placeBet(new BN(amount), sideYes, {
				accounts: {
					market: marketPubkey,
					bet: betKeypair.publicKey,
					userToken,
					escrowToken,
					user: userPubkey,
					systemProgram: SystemProgram.programId,
					tokenProgram: TOKEN_PROGRAM_ID
				}
			})
		);

		return new Response(
			JSON.stringify({
				transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
				betAddress: betKeypair.publicKey.toBase58(),
				message: 'Transaction created. Sign with wallet to place bet.'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200
			}
		);
	} catch (error) {
		console.error('Error placing bet:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to place bet'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 500
			}
		);
	}
};
