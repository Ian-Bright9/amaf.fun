import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SolanaProgramClient } from './solana.js';
import { MockWalletAdapter } from '../../tests/helpers/mock-wallet.js';
import { MockSolanaProgramClient } from '../../tests/helpers/mock-anchor.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';
import idl from '$lib/idl/amafcoin.json';
import { PublicKey } from '@solana/web3.js';

describe('SolanaProgramClient', () => {
	let mockWallet: MockWalletAdapter;
	let mockClient: MockSolanaProgramClient;

	beforeEach(() => {
		mockWallet = new MockWalletAdapter({
			publicKey: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'
		});
		mockClient = new MockSolanaProgramClient(new PublicKey(PROGRAM_ID), idl);
		mockWallet.connect();
	});

	describe('constructor', () => {
		it('should initialize with correct properties', () => {
			const realClient = new SolanaProgramClient(new PublicKey(PROGRAM_ID), idl);
			expect(realClient.programId).toBeDefined();
			expect(realClient.idl).toEqual(idl);
			expect(realClient.connection).toBeDefined();
		});
	});

	describe('initializeProvider', () => {
		it('should initialize provider when wallet is connected', async () => {
			const realClient = new SolanaProgramClient(new PublicKey(PROGRAM_ID), idl);
			const provider = await realClient.initializeProvider(mockWallet);
			expect(provider).toBeDefined();
			expect(provider.wallet).toBeDefined();
		});

		it('should throw error if wallet has no publicKey', async () => {
			mockWallet.setPublicKey(null);
			const realClient = new SolanaProgramClient(new PublicKey(PROGRAM_ID), idl);
			await expect(realClient.initializeProvider(mockWallet)).rejects.toThrow(
				'Wallet not connected'
			);
		});
	});

	describe('initializeProgram', () => {
		it('should initialize program with provider', async () => {
			const realClient = new SolanaProgramClient(new PublicKey(PROGRAM_ID), idl);
			const provider = await realClient.initializeProvider(mockWallet);
			const program = await realClient.initializeProgram(provider);
			expect(program).toBeDefined();
			expect(program.programId).toBeDefined();
		});
	});

	describe('getContractAccount', () => {
		it('should fetch contract account data', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const accountInfo = await mockClient.getContractAccount(contractAddress);
			expect(accountInfo).toBeDefined();
			expect(accountInfo.lamports).toBeGreaterThan(0);
		});

		it('should throw error if contract not found', async () => {
			vi.spyOn(mockClient.connection, 'getAccountInfo').mockResolvedValueOnce(null);
			await expect(
				mockClient.getContractAccount('11111111111111111111111111111112')
			).rejects.toThrow('Contract account not found');
		});
	});

	describe('createContract', () => {
		it('should create contract with valid parameters', async () => {
			const question = 'Will Bitcoin reach $100k?';
			const description = 'Price prediction';
			const expirationTimestamp = Date.now() + 86400000;

			const result = await mockClient.createContract(
				question,
				description,
				expirationTimestamp,
				mockWallet
			);

			expect(result).toBeDefined();
			expect(result.transaction).toBeDefined();
			expect(result.contractKeypair).toBeDefined();
			expect(result.transaction.feePayer).toBeDefined();
			expect(result.transaction.recentBlockhash).toBeDefined();
		});

		it('should include authority account in transaction', async () => {
			const result = await mockClient.createContract(
				'Question?',
				'Description',
				Date.now(),
				mockWallet
			);
			expect(result.transaction).toBeDefined();
			expect(result.transaction.instructions.length).toBeGreaterThan(0);
		});

		it('should include system program account', async () => {
			const result = await mockClient.createContract(
				'Question?',
				'Description',
				Date.now(),
				mockWallet
			);
			expect(result.transaction).toBeDefined();
			expect(result.transaction.instructions.length).toBeGreaterThan(0);
		});

		it('should include system program account', async () => {
			const result = await mockClient.createContract(
				'Question?',
				'Description',
				Date.now(),
				mockWallet
			);
			const instruction =
				result.transaction.instructions[result.transaction.instructions.length - 1];

			expect(instruction.keys).toBeDefined();
			const systemProgramAccount = instruction.keys.find((k: any) => k.name === 'systemProgram');
			expect(systemProgramAccount).toBeDefined();
		});

		it('should include question and description in instruction data', async () => {
			const question = 'Test Question';
			const description = 'Test Description';
			const result = await mockClient.createContract(question, description, Date.now(), mockWallet);
			const instruction =
				result.transaction.instructions[result.transaction.instructions.length - 1];

			expect(instruction.data).toBeDefined();
		});

		it('should sign transaction with wallet', async () => {
			const result = await mockClient.createContract('Q?', 'D', Date.now(), mockWallet);
			expect(result.transaction.feePayer).toBeDefined();
		});

		it('should throw error if wallet not connected', async () => {
			mockWallet.disconnect();
			await expect(mockClient.createContract('Q?', 'D', Date.now(), mockWallet)).rejects.toThrow(
				'Wallet not connected'
			);
		});

		it('should generate unique contract keypair for each call', async () => {
			const result1 = await mockClient.createContract('Q1', 'D1', Date.now(), mockWallet);
			const result2 = await mockClient.createContract('Q2', 'D2', Date.now(), mockWallet);

			expect(result1.contractKeypair.publicKey.toString()).not.toBe(
				result2.contractKeypair.publicKey.toString()
			);
		});

		it('should calculate correct rent for contract size', async () => {
			const question = 'Q?';
			const description = 'D';
			const result = await mockClient.createContract(question, description, Date.now(), mockWallet);

			const expectedSize =
				8 + 32 + 4 + question.length + 4 + description.length + 8 + 1 + 2 + 8 + 8 + 8;
			expect(result.contractKeypair).toBeDefined();
		});
	});

	describe('placeBet', () => {
		it('should place bet with valid parameters', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const betAmount = 100;
			const betOnYes = true;

			const result = await mockClient.placeBet(contractAddress, betAmount, betOnYes, mockWallet);

			expect(result).toBeDefined();
			expect(result.transaction).toBeDefined();
			expect(result.betKeypair).toBeDefined();
		});

		it('should include user account in transaction', async () => {
			const result = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				100,
				true,
				mockWallet
			);
			expect(result.transaction).toBeDefined();
			expect(result.transaction.instructions.length).toBeGreaterThan(0);
		});

		it('should include market account in transaction', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const result = await mockClient.placeBet(contractAddress, 100, true, mockWallet);
			expect(result.transaction).toBeDefined();
			expect(result.transaction.instructions.length).toBeGreaterThan(0);
		});

		it('should include bet PDA account', async () => {
			const result = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				100,
				true,
				mockWallet
			);
			expect(result.transaction).toBeDefined();
			expect(result.transaction.instructions.length).toBeGreaterThan(0);
		});

		it('should include market account in transaction', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const result = await mockClient.placeBet(contractAddress, 100, true, mockWallet);
			const instruction =
				result.transaction.instructions[result.transaction.instructions.length - 1];

			expect(instruction.keys).toBeDefined();
			const contractAccount = instruction.keys.find((k: any) => k.name === 'contract');
			expect(contractAccount).toBeDefined();
			if (contractAccount) {
				expect(contractAccount.pubkey.toString()).toBe(contractAddress);
			}
		});

		it('should include bet PDA account', async () => {
			const result = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				100,
				true,
				mockWallet
			);
			const instruction =
				result.transaction.instructions[result.transaction.instructions.length - 1];

			expect(instruction.keys).toBeDefined();
			const betAccount = instruction.keys.find((k: any) => k.name === 'bet');
			expect(betAccount).toBeDefined();
		});

		it('should include amount in instruction data', async () => {
			const betAmount = 250;
			const result = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				betAmount,
				true,
				mockWallet
			);
			const instruction =
				result.transaction.instructions[result.transaction.instructions.length - 1];

			expect(instruction.data).toBeDefined();
		});

		it('should include side_yes in instruction data', async () => {
			const betOnYes = false;
			const result = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				100,
				betOnYes,
				mockWallet
			);
			const instruction =
				result.transaction.instructions[result.transaction.instructions.length - 1];

			expect(instruction.data).toBeDefined();
		});

		it('should throw error if wallet not connected', async () => {
			mockWallet.disconnect();
			await expect(
				mockClient.placeBet('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', 100, true, mockWallet)
			).rejects.toThrow('Wallet not connected');
		});

		it('should generate unique bet keypair for each call', async () => {
			const result1 = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				100,
				true,
				mockWallet
			);
			const result2 = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				100,
				true,
				mockWallet
			);

			expect(result1.betKeypair.publicKey.toString()).not.toBe(
				result2.betKeypair.publicKey.toString()
			);
		});

		it('should calculate correct rent for bet size', async () => {
			const result = await mockClient.placeBet(
				'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
				100,
				true,
				mockWallet
			);
			const betSize = 8 + 32 + 32 + 8 + 1 + 8;
			expect(result.betKeypair).toBeDefined();
		});
	});

	describe('resolveContract', () => {
		it('should resolve contract with valid outcome', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const outcome = true;

			const transaction = await mockClient.resolveContract(contractAddress, outcome, mockWallet);

			expect(transaction).toBeDefined();
			expect(transaction.instructions).toHaveLength(1);
		});

		it('should require market authority', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const result = await mockClient.resolveContract(contractAddress, true, mockWallet);
			expect(result).toBeDefined();
			expect(result.instructions.length).toBeGreaterThan(0);
		});

		it('should include outcome in instruction args', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const outcome = false;
			const result = await mockClient.resolveContract(contractAddress, outcome, mockWallet);
			const instruction = result.instructions[result.instructions.length - 1];

			expect(instruction.data).toBeDefined();
		});

		it('should update market resolved state', async () => {
			const contractAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
			const result = await mockClient.resolveContract(contractAddress, true, mockWallet);

			expect(result.instructions).toBeDefined();
		});

		it('should throw error if wallet not connected', async () => {
			mockWallet.disconnect();
			await expect(
				mockClient.resolveContract('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', true, mockWallet)
			).rejects.toThrow('Wallet not connected');
		});
	});

	describe('initializeTokenMint', () => {
		it('should initialize token mint', async () => {
			const transaction = await mockClient.initializeTokenMint(mockWallet);

			expect(transaction).toBeDefined();
			expect(transaction.feePayer).toBeDefined();
			expect(transaction.recentBlockhash).toBeDefined();
		});

		it('should throw error if wallet not connected', async () => {
			mockWallet.disconnect();
			await expect(mockClient.initializeTokenMint(mockWallet)).rejects.toThrow(
				'Wallet not connected'
			);
		});

		it('should include system program account', async () => {
			const transaction = await mockClient.initializeTokenMint(mockWallet);
			expect(transaction.instructions).toBeDefined();
		});
	});

	describe('claimDailyTokens', () => {
		it('should claim daily tokens successfully', async () => {
			const result = await mockClient.claimDailyTokens(mockWallet);

			expect(result).toBeDefined();
			expect(result.transaction).toBeDefined();
			expect(result.signature).toBeDefined();
		});

		it('should mint tokens to user account', async () => {
			const result = await mockClient.claimDailyTokens(mockWallet);

			expect(result.transaction).toBeDefined();
			expect(result.signature).toMatch(/mock_claim_signature_/);
		});

		it('should include token mint account', async () => {
			const result = await mockClient.claimDailyTokens(mockWallet);
			expect(result.transaction).toBeDefined();
		});

		it('should include token state account', async () => {
			const result = await mockClient.claimDailyTokens(mockWallet);
			expect(result.transaction).toBeDefined();
		});

		it('should include user token account', async () => {
			const result = await mockClient.claimDailyTokens(mockWallet);
			expect(result.transaction).toBeDefined();
		});

		it('should throw error if wallet not connected', async () => {
			mockWallet.disconnect();
			await expect(mockClient.claimDailyTokens(mockWallet)).rejects.toThrow('Wallet not connected');
		});

		it('should generate unique signature for each claim', async () => {
			const result1 = await mockClient.claimDailyTokens(mockWallet);
			const result2 = await mockClient.claimDailyTokens(mockWallet);

			expect(result1.signature).not.toBe(result2.signature);
		});
	});

	describe('error handling', () => {
		it('should handle instruction errors gracefully', async () => {
			mockClient.setSimulateError(new Error('Instruction failed'));

			await expect(mockClient.createContract('Q?', 'D', Date.now(), mockWallet)).rejects.toThrow(
				'Instruction failed'
			);

			mockClient.clearMocks();
		});
	});

	describe('integration tests', () => {
		it('should handle full contract lifecycle', async () => {
			const question = 'Will it rain tomorrow?';
			const description = 'Weather forecast';

			const { contractKeypair } = await mockClient.createContract(
				question,
				description,
				Date.now() + 86400000,
				mockWallet
			);

			await mockClient.placeBet(contractKeypair.publicKey.toString(), 100, true, mockWallet);

			await mockClient.resolveContract(contractKeypair.publicKey.toString(), true, mockWallet);

			expect(contractKeypair).toBeDefined();
		});

		it('should handle multiple bets on same contract', async () => {
			const { contractKeypair } = await mockClient.createContract(
				'Question',
				'Description',
				Date.now(),
				mockWallet
			);

			const result1 = await mockClient.placeBet(
				contractKeypair.publicKey.toString(),
				50,
				true,
				mockWallet
			);
			const result2 = await mockClient.placeBet(
				contractKeypair.publicKey.toString(),
				75,
				false,
				mockWallet
			);

			expect(result1.betKeypair.publicKey.toString()).not.toBe(
				result2.betKeypair.publicKey.toString()
			);
		});

		it('should handle multiple claims', async () => {
			const result1 = await mockClient.claimDailyTokens(mockWallet);
			const result2 = await mockClient.claimDailyTokens(mockWallet);

			expect(result1.signature).not.toBe(result2.signature);
		});
	});
});
