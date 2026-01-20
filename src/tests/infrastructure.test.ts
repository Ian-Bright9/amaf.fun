import { describe, it, expect } from 'vitest';
import { MockWalletAdapter } from './helpers/mock-wallet.js';
import { MockSolanaProgramClient, MockAnchorProgram } from './helpers/mock-anchor.js';
import { mockMarkets, mockBets, mockWalletStates } from './fixtures/sample-data.js';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';

describe('Test Infrastructure - Phase 2', () => {
	describe('MockWalletAdapter', () => {
		it('should create a mock wallet adapter', () => {
			const wallet = new MockWalletAdapter();
			expect(wallet).toBeDefined();
			expect(wallet.publicKey).toBeDefined();
			expect(wallet.connected).toBe(false);
			expect(wallet.balance).toBe(10);
		});

		it('should connect wallet', async () => {
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			expect(wallet.connected).toBe(true);
		});

		it('should disconnect wallet', async () => {
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			await wallet.disconnect();
			expect(wallet.connected).toBe(false);
		});

		it('should sign transaction', async () => {
			const wallet = new MockWalletAdapter();
			const mockTx = { data: 'mock' };
			const signedTx = await wallet.signTransaction(mockTx);
			expect(signedTx).toEqual(mockTx);
		});

		it('should sign all transactions', async () => {
			const wallet = new MockWalletAdapter();
			const mockTxs = [{ data: 'mock1' }, { data: 'mock2' }];
			const signedTxs = await wallet.signAllTransactions(mockTxs);
			expect(signedTxs).toEqual(mockTxs);
		});

		it('should send transaction', async () => {
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			const mockTx = { data: 'mock' };
			const signature = await wallet.sendTransaction(mockTx);
			expect(signature).toMatch(/^mock_tx_signature_/);
		});

		it('should set and retrieve public key', () => {
			const wallet = new MockWalletAdapter();
			const newKey = 'NewKey111111111111111111111111111';
			wallet.setPublicKey(newKey);
			expect(wallet.publicKey?.toBase58()).toBe(newKey);
		});

		it('should set and retrieve balance', () => {
			const wallet = new MockWalletAdapter();
			wallet.setBalance(100);
			expect(wallet.balance).toBe(100);
		});

		it('should set and retrieve amaf balance', () => {
			const wallet = new MockWalletAdapter();
			wallet.setAmafBalance(5000);
			expect(wallet.amafBalance).toBe(5000);
		});

		it('should simulate error on connect', async () => {
			const wallet = new MockWalletAdapter();
			const error = new Error('Connection failed');
			wallet.setConnectError(error);
			await expect(wallet.connect()).rejects.toThrow('Connection failed');
		});

		it('should reset state', async () => {
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			wallet.setConnectError(new Error('test'));
			wallet.reset();
			expect(wallet.connected).toBe(false);
		});
	});

	describe('MockAnchorProgram', () => {
		it('should create a mock Anchor program', () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const program = new MockAnchorProgram(programId, idlData);
			expect(program).toBeDefined();
			expect(program.programId).toEqual(programId);
			expect(program.idl).toEqual(idlData);
		});

		it('should initialize with wallet', async () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const program = new MockAnchorProgram(programId, idlData);
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			await program.initialize(wallet);
			expect(program.provider).not.toBeNull();
		});

		it('should throw error if wallet not connected', async () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const program = new MockAnchorProgram(programId, idlData);
			const wallet = new MockWalletAdapter();
			await expect(program.initialize(wallet)).rejects.toThrow('Wallet not connected');
		});

		it('should create instructions', () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const program = new MockAnchorProgram(programId, idlData);
			const contractKeypair = Keypair.generate();
			const authorityKeypair = Keypair.generate();
			const instruction = program.instruction.createContract(
				'test question',
				'test description',
				new BN(1234567890),
				{
					accounts: {
						contract: contractKeypair.publicKey,
						authority: authorityKeypair.publicKey,
						systemProgram: new PublicKey('11111111111111111111111111111111')
					}
				}
			);
			expect(instruction).toBeDefined();
			expect(instruction.keys).toHaveLength(3);
			expect(instruction.data).toEqual({
				question: 'test question',
				description: 'test description',
				timestamp: 1234567890
			});
		});

		it('should set and retrieve account data', () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const program = new MockAnchorProgram(programId, idlData);
			const address = 'test-address';
			const data = { value: 123 };
			program.setAccountData(address, data);
			expect(program.getAccountData(address)).toEqual(data);
		});

		it('should simulate errors', () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const program = new MockAnchorProgram(programId, idlData);
			const contractKeypair = Keypair.generate();
			const authorityKeypair = Keypair.generate();
			program.setSimulateError(new Error('test error'));
			expect(() => {
				program.instruction.createContract('q', 'd', new BN(1), {
					accounts: {
						contract: contractKeypair.publicKey,
						authority: authorityKeypair.publicKey,
						systemProgram: new PublicKey('11111111111111111111111111111111')
					}
				});
			}).toThrow('test error');
		});

		it('should clear mocks', () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const program = new MockAnchorProgram(programId, idlData);
			program.setSimulateError(new Error('test'));
			program.setAccountData('test', { data: 'value' });
			program.clearMocks();
			expect(program.getAccountData('test')).toBeUndefined();
		});
	});

	describe('MockSolanaProgramClient', () => {
		it('should create a mock Solana client', () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const client = new MockSolanaProgramClient(programId, idlData);
			expect(client).toBeDefined();
			expect(client.connection).toBeDefined();
			expect(client.program).toBeDefined();
		});

		it('should create contract', async () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const client = new MockSolanaProgramClient(programId, idlData);
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			const result = await client.createContract('question', 'description', 1234567890, wallet);
			expect(result.transaction).toBeDefined();
			expect(result.contractKeypair).toBeDefined();
		});

		it('should place bet', async () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const client = new MockSolanaProgramClient(programId, idlData);
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			const contractKeypair = Keypair.generate();
			const result = await client.placeBet(contractKeypair.publicKey.toBase58(), 100, true, wallet);
			expect(result.transaction).toBeDefined();
			expect(result.betKeypair).toBeDefined();
		});

		it('should resolve contract', async () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const client = new MockSolanaProgramClient(programId, idlData);
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			const contractKeypair = Keypair.generate();
			const transaction = await client.resolveContract(
				contractKeypair.publicKey.toBase58(),
				true,
				wallet
			);
			expect(transaction).toBeDefined();
		});

		it('should claim daily tokens', async () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const client = new MockSolanaProgramClient(programId, idlData);
			const wallet = new MockWalletAdapter();
			await wallet.connect();
			const result = await client.claimDailyTokens(wallet);
			expect(result.transaction).toBeDefined();
			expect(result.signature).toMatch(/^mock_claim_signature_/);
		});

		it('should throw error if wallet not connected', async () => {
			const programId = new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE');
			const idlData = {};
			const client = new MockSolanaProgramClient(programId, idlData);
			const wallet = new MockWalletAdapter();
			await expect(
				client.createContract('question', 'description', 1234567890, wallet)
			).rejects.toThrow('Wallet not connected');
		});
	});

	describe('Sample Data Fixtures', () => {
		it('should provide mock markets', () => {
			expect(mockMarkets).toBeDefined();
			expect(mockMarkets.activeMarket).toBeDefined();
			expect(mockMarkets.resolvedMarketYes).toBeDefined();
			expect(mockMarkets.resolvedMarketNo).toBeDefined();
			expect(mockMarkets.cancelledMarket).toBeDefined();
		});

		it('should provide mock bets', () => {
			expect(mockBets).toBeDefined();
			expect(mockBets.winningYesBet).toBeDefined();
			expect(mockBets.losingNoBet).toBeDefined();
			expect(mockBets.winningNoBet).toBeDefined();
			expect(mockBets.claimedyesBet).toBeDefined();
			expect(mockBets.activeMarketBet).toBeDefined();
		});

		it('should provide mock wallet states', () => {
			expect(mockWalletStates).toBeDefined();
			expect(mockWalletStates.connectedWallet).toBeDefined();
			expect(mockWalletStates.freshWallet).toBeDefined();
			expect(mockWalletStates.recentlyClaimedWallet).toBeDefined();
			expect(mockWalletStates.disconnectedWallet).toBeDefined();
		});

		it('should have consistent market data', () => {
			expect(mockMarkets.activeMarket.id).toBeTruthy();
			expect(mockMarkets.activeMarket.question).toBeTruthy();
			expect(mockMarkets.activeMarket.status).toBe('active');
			expect(mockMarkets.activeMarket.resolved).toBe(false);
		});

		it('should have consistent bet data', () => {
			expect(mockBets.winningYesBet.id).toBeTruthy();
			expect(mockBets.winningYesBet.user).toBeTruthy();
			expect(mockBets.winningYesBet.amount).toBeGreaterThan(0);
			expect(mockBets.winningYesBet.sideYes).toBe(true);
		});

		it('should have consistent wallet state data', () => {
			expect(mockWalletStates.connectedWallet.connected).toBe(true);
			expect(mockWalletStates.connectedWallet.publicKey).toBeTruthy();
			expect(mockWalletStates.connectedWallet.balance).toBeGreaterThan(0);
			expect(mockWalletStates.disconnectedWallet.connected).toBe(false);
		});
	});
});
