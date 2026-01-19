import type { Contract } from '../../types/index.js';

const API_BASE = '/api';

export async function createContract(params: {
	question: string;
	description?: string;
	resolvesAt: string;
	creator: string;
}): Promise<Contract> {
	const response = await fetch(`${API_BASE}/contracts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			question: params.question,
			description: params.description || '',
			expirationTimestamp: new Date(params.resolvesAt).getTime(),
			authority: params.creator
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to create contract');
	}

	return response.json();
}

export async function getContracts(): Promise<any[]> {
	const response = await fetch(`${API_BASE}/contracts`);

	if (!response.ok) {
		return [];
	}

	return response.json();
}

export async function getContract(id: string): Promise<Contract> {
	const response = await fetch(`${API_BASE}/contracts/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch contract');
	}

	return response.json();
}

export async function placeBet(params: {
	contractId: string;
	position: 'yes' | 'no';
	amount: number;
}): Promise<{ transaction: string }> {
	const response = await fetch(`${API_BASE}/bets`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(params)
	});

	if (!response.ok) {
		throw new Error('Failed to place bet');
	}

	return response.json();
}

export async function getBets(contractId: string): Promise<any[]> {
	const response = await fetch(`${API_BASE}/contracts/${contractId}/bets`);

	if (!response.ok) {
		throw new Error('Failed to fetch bets');
	}

	return response.json();
}

export async function resolveContract(params: {
	contractId: string;
	resolution: 'yes' | 'no';
}): Promise<Contract> {
	const response = await fetch(`${API_BASE}/contracts/${params.contractId}/resolve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ resolution: params.resolution })
	});

	if (!response.ok) {
		throw new Error('Failed to resolve contract');
	}

	return response.json();
}
