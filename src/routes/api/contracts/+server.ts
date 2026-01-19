import type { RequestHandler } from '@sveltejs/kit';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';
import { deserializeContract } from '$lib/utils/deserialize.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export const GET: RequestHandler = async () => {
	try {
		const programId = new PublicKey(PROGRAM_ID);
		const accounts = await connection.getProgramAccounts(programId);

		if (accounts.length === 0) {
			return new Response(JSON.stringify([]), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const contracts = [];

		for (const account of accounts) {
			const deserialized = deserializeContract(account.account.data);
			if (!deserialized) continue;

			const now = Date.now() / 1000;
			const isExpired = deserialized.expirationTimestamp <= now;
			const status = deserialized.resolved ? 'resolved' : isExpired ? 'expired' : 'active';
			const resolution =
				deserialized.outcome === true ? 'yes' : deserialized.outcome === false ? 'no' : 'pending';

			const totalVolume = Number(deserialized.totalYesAmount) + Number(deserialized.totalNoAmount);
			const yesPrice = totalVolume > 0 ? Number(deserialized.totalYesAmount) / totalVolume : 0.5;
			const noPrice = totalVolume > 0 ? Number(deserialized.totalNoAmount) / totalVolume : 0.5;

			contracts.push({
				id: account.pubkey.toBase58(),
				question: deserialized.question,
				description: deserialized.description,
				creator: deserialized.authority,
				authority: deserialized.authority,
				resolution,
				status,
				createdAt: new Date(
					deserialized.expirationTimestamp - 30 * 24 * 60 * 60 * 1000
				).toISOString(),
				resolvesAt: new Date(deserialized.expirationTimestamp * 1000).toISOString(),
				expirationTimestamp: deserialized.expirationTimestamp,
				resolved: deserialized.resolved,
				outcome: deserialized.outcome,
				totalYesAmount: Number(deserialized.totalYesAmount),
				totalNoAmount: Number(deserialized.totalNoAmount),
				betCount: Number(deserialized.betCount),
				totalVolume,
				yesPrice,
				noPrice,
				currentYesPrice: yesPrice,
				currentNoPrice: noPrice
			});
		}

		return new Response(JSON.stringify(contracts), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error fetching contracts:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to fetch contracts'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 500
			}
		);
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

		return new Response(
			JSON.stringify({
				message: 'Transaction created. Sign with wallet to complete the contract creation.',
				question,
				description: description || '',
				expirationTimestamp,
				authority
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200
			}
		);
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
