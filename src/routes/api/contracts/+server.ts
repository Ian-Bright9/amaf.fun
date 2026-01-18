import type { RequestHandler } from '@sveltejs/kit';
import type { Contract } from '../../../types/index.js';

export const GET: RequestHandler = async () => {
	return new Response(JSON.stringify([]), {
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	const contract: Contract = {
		id: 'temp-' + Date.now(),
		question: body.question,
		creator: body.creator,
		resolution: 'pending',
		status: 'active',
		createdAt: new Date().toISOString(),
		resolvesAt: body.resolvesAt,
		totalVolume: 0,
		currentYesPrice: 0.5,
		currentNoPrice: 0.5
	};

	return new Response(JSON.stringify(contract), {
		headers: { 'Content-Type': 'application/json' },
		status: 201
	});
};
