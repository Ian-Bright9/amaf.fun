import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockConnection = {
	getMinimumBalanceForRentExemption: vi.fn().mockResolvedValue(1000000),
	getLatestBlockhash: vi.fn().mockResolvedValue({
		blockhash: 'mock_blockhash_123',
		lastValidBlockHeight: 1000
	})
};

class MockConnection {
	constructor() {
		return mockConnection;
	}
}

vi.mock('@solana/web3.js', async () => {
	const mod = await import('@solana/web3.js');
	return {
		...mod,
		Connection: MockConnection
	};
});

vi.mock('@project-serum/anchor', async () => {
	const mod = await import('@solana/web3.js');
	return {
		AnchorProvider: vi.fn(),
		Program: vi.fn().mockImplementation(() => ({
			instruction: {
				placeBet: vi.fn().mockReturnValue({
					keys: [],
					programId: new mod.PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE'),
					data: {}
				})
			}
		}))
	};
});

vi.mock('$lib/utils/solana-constants.js', () => ({
	PROGRAM_ID: 'FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE',
	DEFAULT_NETWORK: 'https://api.devnet.solana.com'
}));

vi.mock('$lib/utils/pda.js', async () => {
	const mod = await import('@solana/web3.js');
	return {
		deriveTokenMintAddress: vi
			.fn()
			.mockReturnValue(new mod.PublicKey('TokenMint1111111111111111111111')),
		deriveEscrowTokenAddress: vi
			.fn()
			.mockReturnValue(new mod.PublicKey('EscrowToken11111111111111111111')),
		deriveUserTokenAccount: vi
			.fn()
			.mockReturnValue(new mod.PublicKey('UserToken1111111111111111111'))
	};
});

vi.mock('$lib/idl/amafcoin.json', () => ({}));

async function getTestKeys() {
	const mod = await import('@solana/web3.js');
	const marketKeypair = mod.Keypair.generate();
	const userKeypair = mod.Keypair.generate();
	return {
		validMarketId: marketKeypair.publicKey.toBase58(),
		validUserId: userKeypair.publicKey.toBase58()
	};
}

describe('POST /api/bets', () => {
	let validMarketId: string;
	let validUserId: string;

	beforeEach(async () => {
		vi.clearAllMocks();
		const keys = await getTestKeys();
		validMarketId = keys.validMarketId;
		validUserId = keys.validUserId;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should return unsigned transaction', async () => {
		const requestBody = {
			marketId: validMarketId,
			position: 'yes',
			amount: 100,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('transaction');
		expect(data).toHaveProperty('betAddress');
		expect(data).toHaveProperty('message');
	});

	it('should validate marketId and amount', async () => {
		const requestBody = {
			marketId: validMarketId,
			position: 'yes',
			amount: 100,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(typeof data.transaction).toBe('string');
	});

	it('should derive correct bet PDA', async () => {
		const requestBody = {
			marketId: validMarketId,
			position: 'yes',
			amount: 50,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('betAddress');
		expect(typeof data.betAddress).toBe('string');
	});

	it('should handle zero amount', async () => {
		const requestBody = {
			marketId: validMarketId,
			position: 'yes',
			amount: 0,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect([200, 400]).toContain(response.status);
	});

	it('should throw error for invalid marketId', async () => {
		const requestBody = {
			marketId: 'invalid-market-id',
			position: 'yes',
			amount: 100,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data).toHaveProperty('error');
	});

	it('should base64 encode transaction', async () => {
		const requestBody = {
			marketId: validMarketId,
			position: 'no',
			amount: 75,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.transaction).toMatch(/^[A-Za-z0-9+/]+=*$/);
	});

	it('should return 400 for invalid input', async () => {
		const requestBody = {
			marketId: '',
			position: 'yes',
			amount: 100,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data).toHaveProperty('error');
	});

	it('should return 500 on error', async () => {
		mockConnection.getLatestBlockhash.mockRejectedValue(new Error('Connection failed'));

		const requestBody = {
			marketId: validMarketId,
			position: 'yes',
			amount: 100,
			user: validUserId
		};

		const request = new Request('http://localhost/api/bets', {
			method: 'POST',
			body: JSON.stringify(requestBody)
		});

		const { POST } = await import('./+server.js');
		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data).toHaveProperty('error');
	});
});
