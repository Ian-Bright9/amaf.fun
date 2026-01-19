import type { RequestHandler } from '@sveltejs/kit';
import { Connection, PublicKey, Transaction, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { PROGRAM_ID, DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
import idl from '$lib/idl/amafcoin.json';

const connection = new Connection(DEFAULT_NETWORK, 'confirmed');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_MINT = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { authority } = body;

		if (!authority) {
			return new Response(
				JSON.stringify({
					error: 'Missing required field: authority'
				}),
				{
					headers: { 'Content-Type': 'application/json' },
					status: 400
				}
			);
		}

		const authorityPubkey = new PublicKey(authority);
		const [tokenStatePda] = PublicKey.findProgramAddressSync(
			[Buffer.from('token_state')],
			PROGRAM_ID
		);

		const provider = new AnchorProvider(
			connection,
			{
				publicKey: authorityPubkey,
				signTransaction: async (tx: any) => {
					return tx;
				},
				signAllTransactions: async (txs: any[]) => {
					return txs;
				}
			} as any,
			{ commitment: 'confirmed' }
		);

		const program = new Program(idl as any, PROGRAM_ID, provider);

		const transaction = new Transaction();
		transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
		transaction.feePayer = authorityPubkey;

		transaction.add(
			program.instruction.claimDailyTokens({
				accounts: {
					tokenMint: TOKEN_MINT,
					tokenState: tokenStatePda,
					userTokenAccount: authorityPubkey,
					authority: authorityPubkey,
					tokenProgram: TOKEN_PROGRAM_ID
				}
			})
		);

		return new Response(
			JSON.stringify({
				transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
				message: 'Transaction created. Sign with wallet to claim tokens.'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200
			}
		);
	} catch (error) {
		console.error('Error claiming tokens:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to claim tokens'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 500
			}
		);
	}
};
