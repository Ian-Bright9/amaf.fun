import type { RequestHandler } from '@sveltejs/kit';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { contractId, position, amount, bettor } = body;

		if (!contractId || !position || !amount || !bettor) {
			return new Response(
				JSON.stringify({
					error: 'Missing required fields: contractId, position, amount, bettor'
				}),
				{
					headers: { 'Content-Type': 'application/json' },
					status: 400
				}
			);
		}

		const contractPubkey = new PublicKey(contractId);
		const betKeypair = Keypair.generate();
		const betSize = 8 + 32 + 32 + 8 + 1 + 8;

		const transaction = new Transaction();

		transaction.add(
			SystemProgram.createAccount({
				fromPubkey: new PublicKey(bettor),
				newAccountPubkey: betKeypair.publicKey,
				lamports: await connection.getMinimumBalanceForRentExemption(betSize),
				space: betSize,
				programId: new PublicKey(PROGRAM_ID)
			})
		);

		transaction.add(
			SystemProgram.transfer({
				fromPubkey: new PublicKey(bettor),
				toPubkey: contractPubkey,
				lamports: amount
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
