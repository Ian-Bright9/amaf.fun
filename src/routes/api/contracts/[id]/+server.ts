import type { RequestHandler } from '@sveltejs/kit';
import type { Contract } from '../../../types/index.js';

// Mock data for development
const mockContracts: Contract[] = [
	{
		id: '1',
		question: 'Will Bitcoin reach $100,000 by December 31st, 2025?',
		creator: '0x1234567890123456789012345678901234567890',
		resolution: 'pending',
		status: 'active',
		createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
		resolvesAt: new Date('2025-12-31T23:59:59Z').toISOString(),
		totalVolume: 50000,
		currentYesPrice: 0.65,
		currentNoPrice: 0.35
	},
	{
		id: '2',
		question: 'Will SpaceX land humans on Mars before 2030?',
		creator: '0x9876543210987654321098765432109876543210',
		resolution: 'pending',
		status: 'active',
		createdAt: new Date('2024-02-01T14:30:00Z').toISOString(),
		resolvesAt: new Date('2030-01-01T00:00:00Z').toISOString(),
		totalVolume: 25000,
		currentYesPrice: 0.42,
		currentNoPrice: 0.58
	},
	{
		id: '3',
		question: 'Will Ethereum 2.0 achieve 100,000 TPS by end of 2025?',
		creator: '0xabcdef1234567890abcdef1234567890abcdef12',
		resolution: 'yes',
		status: 'resolved',
		createdAt: new Date('2024-01-01T09:00:00Z').toISOString(),
		resolvesAt: new Date('2024-06-30T23:59:59Z').toISOString(),
		totalVolume: 15000,
		currentYesPrice: 1.0,
		currentNoPrice: 0.0
	}
];

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	const contract = mockContracts.find(c => c.id === id);
	
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