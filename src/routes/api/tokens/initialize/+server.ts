import type { RequestHandler } from '@sveltejs/kit';
import {
	Connection,
	PublicKey,
	Keypair,
	Transaction,
	SystemProgram,
	LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { PROGRAM_ID, DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
import idl from '$lib/idl/amafcoin.json';

const connection = new Connection(DEFAULT_NETWORK, 'confirmed');

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
		const tokenStateKeypair = Keypair.generate();
		const [tokenStatePda] = PublicKey.findProgramAddressSync(
			[Buffer.from('token_state')],
			PROGRAM_ID
		);

		const tokenStateSize = 8 + 32 + 8 + 8;
		const rent = await connection.getMinimumBalanceForRentExemption(tokenStateSize);

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
				newAccountPubkey: tokenStateKeypair.publicKey,
				lamports: rent,
				space: tokenStateSize,
				programId: PROGRAM_ID
			})
		);

		transaction.add(
			program.instruction.initializeTokenMint({
				accounts: {
					tokenState: tokenStateKeypair.publicKey,
					authority: authorityPubkey
				}
			})
		);

		return new Response(
			JSON.stringify({
				transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
				tokenStateAddress: tokenStateKeypair.publicKey.toBase58(),
				message: 'Transaction created. Sign with wallet to initialize token system.'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200
			}
		);
	} catch (error) {
		console.error('Error initializing token mint:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to initialize token system'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 500
			}
		);
	}
};
