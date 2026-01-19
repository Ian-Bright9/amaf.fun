import type { RequestHandler } from '@sveltejs/kit';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { PROGRAM_ID, DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
import idl from '$lib/idl/amafcoin.json';

const connection = new Connection(DEFAULT_NETWORK, 'confirmed');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { contractId, resolution, authority } = body;

		if (!contractId || !resolution || !authority) {
			return new Response(
				JSON.stringify({
					error: 'Missing required fields: contractId, resolution, authority'
				}),
				{
					headers: { 'Content-Type': 'application/json' },
					status: 400
				}
			);
		}

		const contractPubkey = new PublicKey(contractId);
		const authorityPubkey = new PublicKey(authority);

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
			program.instruction.resolveContract(resolution === 'yes', {
				accounts: {
					contract: contractPubkey,
					authority: authorityPubkey
				}
			})
		);

		return new Response(
			JSON.stringify({
				transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
				message: 'Transaction created. Sign with wallet to resolve contract.'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200
			}
		);
	} catch (error) {
		console.error('Error resolving contract:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to resolve contract'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 500
			}
		);
	}
};
