import type { RequestHandler } from '@sveltejs/kit';
import type { Contract } from '../../../../types/index.js';

// Mock data for development
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
	},
	{
		id: '3',
		question: 'Will Ethereum 2.0 achieve 100,000 TPS by end of 2025?',
		description: 'Ethereum scaling prediction market',
		creator: '0xabcdef1234567890abcdef1234567890abcdef12',
		authority: '0xabcdef1234567890abcdef1234567890abcdef12',
		resolution: 'yes',
		status: 'resolved',
		createdAt: new Date('2024-01-01T09:00:00Z').toISOString(),
		resolvesAt: new Date('2024-06-30T23:59:59Z').toISOString(),
		expirationTimestamp: new Date('2024-06-30T23:59:59Z').getTime(),
		resolved: true,
		outcome: true,
		totalYesAmount: 15000,
		totalNoAmount: 0,
		betCount: 42,
		totalVolume: 15000,
		yesPrice: 1.0,
		noPrice: 0.0,
		currentYesPrice: 1.0,
		currentNoPrice: 0.0
	}
];

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	const contract = mockContracts.find((c) => c.id === id);

	if (!contract) {
		return new Response(JSON.stringify({ error: 'Contract not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return new Response(JSON.stringify(contract), {
		headers: { 'Content-Type': 'application/json' }
	});
};
