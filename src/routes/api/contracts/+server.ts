import type { RequestHandler } from '@sveltejs/kit';
import type { Contract } from '../../../types/index.js';

export const GET: RequestHandler = async () => {
	// Return mock data that matches our new interface
	const mockContracts: Contract[] = [
		{
			id: '1',
			question: 'Will Bitcoin reach $100,000 by December 31st, 2025?',
			description: 'Bitcoin price prediction market for end of 2025',
			creator: '0x1234567890123456789012345678901234567890',
			authority: '0x1234567890123456789012345678901234567890',
			resolution: 'pending',
			status: 'active',
			createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
			resolvesAt: new Date('2025-12-31T23:59:59Z').toISOString(),
			expirationTimestamp: new Date('2025-12-31T23:59:59Z').getTime(),
			resolved: false,
			totalYesAmount: 32500,
			totalNoAmount: 17500,
			betCount: 156,
			totalVolume: 50000,
			yesPrice: 0.65,
			noPrice: 0.35,
			currentYesPrice: 0.65,
			currentNoPrice: 0.35
		},
		{
			id: '2',
			question: 'Will SpaceX land humans on Mars before 2030?',
			description: 'SpaceX Mars mission timeline prediction',
			creator: '0x9876543210987654321098765432109876543210',
			authority: '0x9876543210987654321098765432109876543210',
			resolution: 'pending',
			status: 'active',
			createdAt: new Date('2024-02-01T14:30:00Z').toISOString(),
			resolvesAt: new Date('2030-01-01T00:00:00Z').toISOString(),
			expirationTimestamp: new Date('2030-01-01T00:00:00Z').getTime(),
			resolved: false,
			totalYesAmount: 10500,
			totalNoAmount: 14500,
			betCount: 89,
			totalVolume: 25000,
			yesPrice: 0.42,
			noPrice: 0.58,
			currentYesPrice: 0.42,
			currentNoPrice: 0.58
		}
	];

	return new Response(JSON.stringify(mockContracts), {
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	const contract: Contract = {
		id: 'temp-' + Date.now(),
		question: body.question,
		description: body.description || '',
		creator: body.creator,
		authority: body.authority || body.creator,
		resolution: 'pending',
		status: 'active',
		createdAt: new Date().toISOString(),
		resolvesAt: new Date(
			body.expirationTimestamp || Date.now() + 30 * 24 * 60 * 60 * 1000
		).toISOString(),
		expirationTimestamp: body.expirationTimestamp || Date.now() + 30 * 24 * 60 * 60 * 1000,
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
};
