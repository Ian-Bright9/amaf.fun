import type { RequestHandler } from '@sveltejs/kit';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

interface CreateContractResponse {
	transaction: string;
	contractAddress: string;
	message: string;
}

interface ErrorResponse {
	error: string;
}

export const GET: RequestHandler = async () => {
	try {
		const programId = new PublicKey(PROGRAM_ID);
		const accounts = await connection.getProgramAccounts(programId);

		if (accounts.length === 0) {
			return new Response(JSON.stringify([]), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const contracts = accounts.map((account) => {
			const data = account.account.data;
			return {
				id: account.pubkey.toBase58(),
				question: 'Question from chain',
				description: '',
				creator: 'unknown',
				authority: 'unknown',
				resolution: 'pending',
				status: 'active',
				createdAt: new Date().toISOString(),
				resolvesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				expirationTimestamp: Date.now() + 30 * 24 * 60 * 60 * 1000,
				resolved: false,
				totalYesAmount: 0,
				totalNoAmount: 0,
				betCount: 0,
				totalVolume: 0,
				yesPrice: 0.5,
				noPrice: 0.5,
				currentYesPrice: 0.5,
				currentNoPrice: 0.5
			};
		});

		return new Response(JSON.stringify(contracts), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify([]), {
			headers: { 'Content-Type': 'application/json' },
			status: 500
		});
	}
};

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

		const contractKeypair = Keypair.generate();
		const contractId = contractKeypair.publicKey.toBase58();
		const contractSize = 8 + 32 + 200 + 500 + 8 + 1 + 1 + 8 + 8 + 8;
		const resolvesAt = new Date(expirationTimestamp).toISOString();
		const now = new Date().toISOString();

		const transaction = new Transaction();

		transaction.add(
			SystemProgram.createAccount({
				fromPubkey: new PublicKey(authority),
				newAccountPubkey: contractKeypair.publicKey,
				lamports: await connection.getMinimumBalanceForRentExemption(contractSize),
				space: contractSize,
				programId: new PublicKey(PROGRAM_ID)
			})
		);

		const contract = {
			id: contractId,
			question,
			description: description || '',
			creator: authority,
			authority,
			resolution: 'pending',
			status: 'active',
			createdAt: now,
			resolvesAt,
			expirationTimestamp,
			resolved: false,
			totalYesAmount: 0,
			totalNoAmount: 0,
			betCount: 0,
			totalVolume: 0,
			yesPrice: 0.5,
			noPrice: 0.5,
			currentYesPrice: 0.5,
			currentNoPrice: 0.5
		};

		return new Response(JSON.stringify(contract), {
			headers: { 'Content-Type': 'application/json' },
			status: 201
		});
	} catch (error) {
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
