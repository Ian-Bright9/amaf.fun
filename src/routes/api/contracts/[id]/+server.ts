import type { RequestHandler } from '@sveltejs/kit';
import type { Contract } from '../../../../types/index.js';

const mockContracts: Contract[] = [
	{
		id: '1',
		question: 'Will Bitcoin reach $100,000 by December 31st, 2025?',
		description: 'Bitcoin price prediction market for end of 2025',
		creator: '0x12345678901234567890123456789012345678901234567890',
		authority: '0x12345678901234567890123456789012345678901234567890',
		resolution: 'pending',
		status: 'active',
		createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
		resolvesAt: new Date('2025-12-31T23:59:59Z').toISOString(),
		resolved: false,
		totalYes: 32500,
		totalNo: 17500,
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
		resolution: 'yes',
		status: 'resolved',
		createdAt: new Date('2024-02-01T14:30:00Z').toISOString(),
		resolvesAt: new Date('2024-12-31T23:59:59Z').toISOString(),
		resolved: true,
		outcome: true,
		totalYes: 15000,
		totalNo: 0,
		totalVolume: 15000,
		yesPrice: 1.0,
		noPrice: 0.0,
		currentYesPrice: 1.0,
		currentNoPrice: 0.0
	},
	{
		id: '3',
		question: 'Will Ethereum 2.0 achieve 100,000 TPS by end of 2025?',
		description: 'Ethereum scaling prediction market',
		creator: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
		authority: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
		resolution: 'pending',
		status: 'active',
		createdAt: new Date('2024-02-01T09:00:00Z').toISOString(),
		resolvesAt: new Date('2025-12-31T23:59:59Z').toISOString(),
		resolved: false,
		totalYes: 10500,
		totalNo: 14500,
		totalVolume: 25000,
		yesPrice: 0.42,
		noPrice: 0.58,
		currentYesPrice: 0.42,
		currentNoPrice: 0.58
	}
];

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	const contract = mockContracts.find((c) => c.id === id);

	if (!contract) {
		return new Response(
			JSON.stringify({
				error: 'Contract not found'
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 404
			}
		);
	}

	return new Response(JSON.stringify(contract), {
		headers: { 'Content-Type': 'application/json' }
	});
};
