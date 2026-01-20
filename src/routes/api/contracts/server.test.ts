import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockMarkets } from '../../../tests/fixtures/sample-data.js';

const mockConnection = {
	getProgramAccounts: vi.fn()
};

vi.mock('@solana/web3.js', async () => {
	const { PublicKey } = await import('@solana/web3.js');
	return {
		Connection: function () {
			return mockConnection;
		},
		PublicKey
	};
});

vi.mock('$lib/utils/solana-constants.js', () => ({
	PROGRAM_ID: 'FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE'
}));

const mockDeserializeContract = vi.fn();

vi.mock('$lib/utils/deserialize.js', () => ({
	deserializeContract: mockDeserializeContract
}));

describe('GET /api/contracts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should return array of markets', async () => {
		const mockAccount = {
			pubkey: { toBase58: () => mockMarkets.activeMarket.id },
			account: {
				data: Buffer.alloc(100)
			}
		};

		mockConnection.getProgramAccounts.mockResolvedValue([mockAccount]);

		mockDeserializeContract.mockReturnValue({
			question: mockMarkets.activeMarket.question,
			description: mockMarkets.activeMarket.description,
			authority: mockMarkets.activeMarket.authority,
			resolved: false,
			outcome: null,
			totalYesAmount: BigInt(5000),
			totalNoAmount: BigInt(3000),
			betCount: 5,
			expirationTimestamp: Date.now() / 1000 + 86400
		});

		const { GET } = await import('./+server.js');
		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
	});

	it('should include all market fields', async () => {
		const mockAccount = {
			pubkey: { toBase58: () => mockMarkets.activeMarket.id },
			account: { data: Buffer.alloc(100) }
		};

		mockConnection.getProgramAccounts.mockResolvedValue([mockAccount]);

		mockDeserializeContract.mockReturnValue({
			question: 'Test question',
			description: 'Test description',
			authority: 'AuthKey123',
			resolved: false,
			outcome: null,
			totalYesAmount: BigInt(1000),
			totalNoAmount: BigInt(500),
			betCount: 2,
			expirationTimestamp: Date.now() / 1000 + 86400
		});

		const { GET } = await import('./+server.js');
		const response = await GET();
		const [market] = await response.json();

		expect(market).toHaveProperty('id');
		expect(market).toHaveProperty('question');
		expect(market).toHaveProperty('description');
		expect(market).toHaveProperty('creator');
		expect(market).toHaveProperty('authority');
		expect(market).toHaveProperty('resolution');
		expect(market).toHaveProperty('status');
		expect(market).toHaveProperty('totalYesAmount');
		expect(market).toHaveProperty('totalNoAmount');
		expect(market).toHaveProperty('totalVolume');
		expect(market).toHaveProperty('yesPrice');
		expect(market).toHaveProperty('noPrice');
	});

	it('should handle empty results', async () => {
		mockConnection.getProgramAccounts.mockResolvedValue([]);

		const { GET } = await import('./+server.js');
		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual([]);
	});

	it('should return 500 on error', async () => {
		mockConnection.getProgramAccounts.mockRejectedValue(new Error('Connection failed'));

		const { GET } = await import('./+server.js');
		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data).toHaveProperty('error');
		expect(data.error).toContain('Connection failed');
	});
});

describe('POST /api/contracts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should return unsigned transaction', async () => {
		const requestBody = {
			question: 'Will Bitcoin reach $100k?',
			description: 'Betting on BTC price',
			expirationTimestamp: Date.now() / 1000 + 86400,
			authority: 'AuthKey123'
		};

		const request = new Request('http://localhost/api/contracts', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('message');
		expect(data.question).toBe(requestBody.question);
	});

	it('should validate question and description', async () => {
		const requestBody = {
			question: 'Test question',
			description: 'Test description',
			expirationTimestamp: Date.now() / 1000 + 86400,
			authority: 'AuthKey123'
		};

		const request = new Request('http://localhost/api/contracts', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('question');
	});

	it('should return 400 for missing fields', async () => {
		const requestBody = {
			question: 'Test question'
		};

		const request = new Request('http://localhost/api/contracts', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data).toHaveProperty('error');
	});

	it('should return 400 for empty strings', async () => {
		const requestBody = {
			question: '',
			description: '',
			expirationTimestamp: Date.now() / 1000 + 86400,
			authority: 'AuthKey123'
		};

		const request = new Request('http://localhost/api/contracts', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data).toHaveProperty('error');
	});

	it('should return 500 on error building transaction', async () => {
		const request = new Request('http://localhost/api/contracts', {
			method: 'POST',
			body: 'invalid json'
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data).toHaveProperty('error');
	});
});
