import type { RequestHandler } from '@sveltejs/kit';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { PROGRAM_ID, DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
import idl from '$lib/idl/amafcoin.json';

const connection = new Connection(DEFAULT_NETWORK, 'confirmed');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { question, description, expirationTimestamp, authority } = body;

		if (!question || !expirationTimestamp || !authority) {
			return new Response(
				JSON.stringify({
					error: 'Missing required fields: question, expirationTimestamp, authority'
				}),
				{
					headers: { 'Content-Type': 'application/json' },
					status: 400
				}
			);
		}

		const authorityPubkey = new PublicKey(authority);
		const contractKeypair = Keypair.generate();

		const contractSize =
			8 + 32 + 4 + question.length + 4 + (description?.length || 0) + 8 + 1 + 2 + 8 + 8 + 8;
		const rent = await connection.getMinimumBalanceForRentExemption(contractSize);

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
			SystemProgram.createAccount({
				fromPubkey: authorityPubkey,
				newAccountPubkey: contractKeypair.publicKey,
				lamports: rent,
				space: contractSize,
				programId: PROGRAM_ID
			})
		);

		transaction.add(
			program.instruction.createContract(question, description || '', new BN(expirationTimestamp), {
				accounts: {
					contract: contractKeypair.publicKey,
					authority: authorityPubkey,
					systemProgram: SystemProgram.programId
				}
			})
		);

		return new Response(
			JSON.stringify({
				transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
				contractAddress: contractKeypair.publicKey.toBase58(),
				message: 'Transaction created. Sign with wallet to create contract.'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200
			}
		);
	} catch (error) {
		console.error('Error creating contract transaction:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to create contract'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 500
			}
		);
	}
};
