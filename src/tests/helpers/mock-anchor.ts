import { PublicKey, Keypair, Transaction } from '@solana/web3.js';
import BN from 'bn.js';

export interface MockProgram {
	idl: any;
	programId: PublicKey;
	instruction: {
		createContract: (question: string, description: string, timestamp: BN, options: any) => any;
		placeBet: (amount: BN, betOnYes: boolean, options: any) => any;
		resolveContract: (outcome: boolean, options: any) => any;
	};
}

export interface MockAnchorProvider {
	connection: any;
	wallet: any;
}

export class MockAnchorProgram {
	public programId: PublicKey;
	public idl: any;
	public provider: MockAnchorProvider | null;
	public _simulateError: Error | null;
	public _transactionResult: any;
	public _accountData: Map<string, any>;

	constructor(programId: PublicKey, idlData: any) {
		this.programId = programId;
		this.idl = idlData;
		this.provider = null;
		this._simulateError = null;
		this._transactionResult = null;
		this._accountData = new Map();
	}

	async initialize(walletAdapter: any): Promise<void> {
		if (!walletAdapter || !walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}
		this.provider = {
			connection: {},
			wallet: walletAdapter
		};
	}

	get instruction() {
		return {
			createContract: (question: string, description: string, timestamp: BN, options: any) => {
				if (this._simulateError) {
					throw this._simulateError;
				}
				return {
					keys: [
						{
							name: 'contract',
							pubkey: options.accounts.contract,
							isSigner: true,
							isWritable: true
						},
						{
							name: 'authority',
							pubkey: options.accounts.authority,
							isSigner: true,
							isWritable: false
						},
						{
							name: 'systemProgram',
							pubkey: options.accounts.systemProgram,
							isSigner: false,
							isWritable: false
						}
					],
					programId: this.programId,
					data: { question, description, timestamp: timestamp.toNumber() }
				};
			},
			placeBet: (amount: BN, betOnYes: boolean, options: any) => {
				if (this._simulateError) {
					throw this._simulateError;
				}
				return {
					keys: [
						{
							name: 'contract',
							pubkey: options.accounts.contract,
							isSigner: false,
							isWritable: true
						},
						{
							name: 'bet',
							pubkey: options.accounts.bet,
							isSigner: true,
							isWritable: true
						},
						{
							name: 'bettor',
							pubkey: options.accounts.bettor,
							isSigner: true,
							isWritable: true
						},
						{
							name: 'systemProgram',
							pubkey: options.accounts.systemProgram,
							isSigner: false,
							isWritable: false
						}
					],
					programId: this.programId,
					data: { amount: amount.toNumber(), betOnYes }
				};
			},
			resolveContract: (outcome: boolean, options: any) => {
				if (this._simulateError) {
					throw this._simulateError;
				}
				return {
					keys: [
						{
							name: 'contract',
							pubkey: options.accounts.contract,
							isSigner: false,
							isWritable: true
						},
						{
							name: 'authority',
							pubkey: options.accounts.authority,
							isSigner: true,
							isWritable: false
						}
					],
					programId: this.programId,
					data: { outcome }
				};
			}
		};
	}

	setAccountData(address: string, data: any): void {
		this._accountData.set(address, data);
	}

	getAccountData(address: string): any {
		return this._accountData.get(address);
	}

	setSimulateError(error: Error | null): void {
		this._simulateError = error;
	}

	setTransactionResult(result: any): void {
		this._transactionResult = result;
	}

	async simulateTransaction(method: string, args: any[]): Promise<any> {
		if (this._simulateError) {
			throw this._simulateError;
		}
		return this._transactionResult || { success: true };
	}

	clearMocks(): void {
		this._simulateError = null;
		this._transactionResult = null;
		this._accountData.clear();
	}
}

export class MockSolanaProgramClient {
	public connection: any;
	public programId: PublicKey;
	public program: MockAnchorProgram | null;

	constructor(programId: PublicKey, idlData: any) {
		this.connection = {
			getAccountInfo: async (pubkey: PublicKey) => {
				return {
					lamports: 1000000,
					data: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
					owner: programId,
					executable: false
				};
			},
			getMinimumBalanceForRentExemption: async (size: number) => {
				return size * 1000;
			},
			getLatestBlockhash: async () => {
				return { blockhash: 'mock_blockhash_123', lastValidBlockHeight: 1000 };
			}
		};
		this.programId = programId;
		this.program = new MockAnchorProgram(programId, idlData);
	}

	async initializeProvider(walletAdapter: any): Promise<MockAnchorProvider> {
		if (!walletAdapter || !walletAdapter.publicKey) {
			throw new Error('Wallet not connected');
		}
		await this.program?.initialize(walletAdapter);
		return {
			connection: this.connection,
			wallet: walletAdapter
		};
	}

	async initializeProgram(provider: any): Promise<MockAnchorProgram> {
		if (!this.program) {
			throw new Error('Program not initialized');
		}
		this.program.provider = provider;
		return this.program;
	}

	async getContractAccount(contractAddress: string) {
		const contractPubkey = new PublicKey(contractAddress);
		const accountInfo = await this.connection.getAccountInfo(contractPubkey);

		if (!accountInfo) {
			throw new Error('Contract account not found');
		}

		return accountInfo;
	}

	async createContract(
		question: string,
		description: string,
		expirationTimestamp: number,
		walletAdapter: any
	): Promise<{ transaction: Transaction; contractKeypair: Keypair }> {
		if (!walletAdapter || !walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const contractKeypair = Keypair.generate();
		const contractSize =
			8 + 32 + 4 + question.length + 4 + description.length + 8 + 1 + 2 + 8 + 8 + 8;
		const rent = await this.connection.getMinimumBalanceForRentExemption(contractSize);

		const transaction = new Transaction();
		const blockhash = await this.connection.getLatestBlockhash();
		transaction.recentBlockhash = blockhash.blockhash;
		transaction.feePayer = new PublicKey(walletAdapter.publicKey.toBase58());

		transaction.add({
			keys: [
				{
					pubkey: new PublicKey(walletAdapter.publicKey.toBase58()),
					isSigner: true,
					isWritable: true
				},
				{ pubkey: contractKeypair.publicKey, isSigner: true, isWritable: true },
				{ pubkey: this.programId, isSigner: false, isWritable: false }
			],
			programId: this.programId,
			data: Buffer.from([1])
		});

		const instruction = this.program?.instruction.createContract(
			question,
			description,
			new BN(expirationTimestamp),
			{
				accounts: {
					contract: contractKeypair.publicKey,
					authority: new PublicKey(walletAdapter.publicKey.toBase58()),
					systemProgram: new PublicKey('11111111111111111111111111111111')
				}
			}
		);

		if (instruction) {
			transaction.add(instruction as any);
		}

		return { transaction, contractKeypair };
	}

	async placeBet(
		contractAddress: string,
		betAmount: number,
		betOnYes: boolean,
		walletAdapter: any
	): Promise<{ transaction: Transaction; betKeypair: Keypair }> {
		if (!walletAdapter || !walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const betKeypair = Keypair.generate();
		const betSize = 8 + 32 + 32 + 8 + 1 + 8;
		const rent = await this.connection.getMinimumBalanceForRentExemption(betSize);

		const transaction = new Transaction();
		const blockhash = await this.connection.getLatestBlockhash();
		transaction.recentBlockhash = blockhash.blockhash;
		transaction.feePayer = new PublicKey(walletAdapter.publicKey.toBase58());

		const instruction = this.program?.instruction.placeBet(new BN(betAmount), betOnYes, {
			accounts: {
				contract: new PublicKey(contractAddress),
				bet: betKeypair.publicKey,
				bettor: new PublicKey(walletAdapter.publicKey.toBase58()),
				systemProgram: new PublicKey('11111111111111111111111111111111')
			}
		});

		if (instruction) {
			transaction.add(instruction as any);
		}

		return { transaction, betKeypair };
	}

	async resolveContract(
		contractAddress: string,
		outcome: boolean,
		walletAdapter: any
	): Promise<Transaction> {
		if (!walletAdapter || !walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const transaction = new Transaction();
		const blockhash = await this.connection.getLatestBlockhash();
		transaction.recentBlockhash = blockhash.blockhash;
		transaction.feePayer = new PublicKey(walletAdapter.publicKey.toBase58());

		const instruction = this.program?.instruction.resolveContract(outcome, {
			accounts: {
				contract: new PublicKey(contractAddress),
				authority: new PublicKey(walletAdapter.publicKey.toBase58())
			}
		});

		if (instruction) {
			transaction.add(instruction as any);
		}

		return transaction;
	}

	async initializeTokenMint(walletAdapter: any): Promise<Transaction> {
		if (!walletAdapter || !walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const transaction = new Transaction();
		const blockhash = await this.connection.getLatestBlockhash();
		transaction.recentBlockhash = blockhash.blockhash;
		transaction.feePayer = new PublicKey(walletAdapter.publicKey.toBase58());

		return transaction;
	}

	async claimDailyTokens(
		walletAdapter: any
	): Promise<{ transaction: Transaction; signature: string }> {
		if (!walletAdapter || !walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const transaction = new Transaction();
		const blockhash = await this.connection.getLatestBlockhash();
		transaction.recentBlockhash = blockhash.blockhash;
		transaction.feePayer = new PublicKey(walletAdapter.publicKey.toBase58());

		const signature = 'mock_claim_signature_' + Math.random().toString(36).substring(7);

		return { transaction, signature };
	}

	setSimulateError(error: Error | null): void {
		this.program?.setSimulateError(error);
	}

	clearMocks(): void {
		this.program?.clearMocks();
	}
}
