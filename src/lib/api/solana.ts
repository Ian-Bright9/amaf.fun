import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { PROGRAM_ID, DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
import idl from '$lib/idl/amafcoin.json';

const connection = new Connection(DEFAULT_NETWORK, 'confirmed');

export class SolanaProgramClient {
	connection: Connection;
	programId: PublicKey;
	program: Program | null = null;
	idl: any;

	constructor(programId: PublicKey, idlData: any) {
		this.connection = connection;
		this.programId = programId;
		this.idl = idlData;
	}

	async initializeProvider(walletAdapter: any) {
		if (!walletAdapter.publicKey) {
			throw new Error('Wallet not connected');
		}

		const provider = new AnchorProvider(this.connection, walletAdapter, {
			commitment: 'confirmed'
		});
		return provider;
	}

	async initializeProgram(provider: AnchorProvider) {
		this.program = new Program(this.idl, this.programId, provider);
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
		const contractKeypair = Keypair.generate();
		const provider = await this.initializeProvider(walletAdapter);

		if (!this.program) {
			this.program = new Program(this.idl, this.programId, provider);
		}

		const contractSize =
			8 + 32 + 4 + question.length + 4 + description.length + 8 + 1 + 2 + 8 + 8 + 8;
		const rent = await this.connection.getMinimumBalanceForRentExemption(contractSize);

		const transaction = new Transaction();
		transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
		transaction.feePayer = walletAdapter.publicKey;

		transaction.add(
			SystemProgram.createAccount({
				fromPubkey: walletAdapter.publicKey,
				newAccountPubkey: contractKeypair.publicKey,
				lamports: rent,
				space: contractSize,
				programId: this.programId
			})
		);

		transaction.add(
			this.program.instruction.createContract(question, description, new BN(expirationTimestamp), {
				accounts: {
					contract: contractKeypair.publicKey,
					authority: walletAdapter.publicKey,
					systemProgram: SystemProgram.programId
				}
			})
		);

		return { transaction, contractKeypair };
	}

	async placeBet(
		contractAddress: string,
		betAmount: number,
		betOnYes: boolean,
		walletAdapter: any
	): Promise<{ transaction: Transaction; betKeypair: Keypair }> {
		const contractPubkey = new PublicKey(contractAddress);
		const betKeypair = Keypair.generate();
		const provider = await this.initializeProvider(walletAdapter);

		if (!this.program) {
			this.program = new Program(this.idl, this.programId, provider);
		}

		const betSize = 8 + 32 + 32 + 8 + 1 + 8;
		const rent = await this.connection.getMinimumBalanceForRentExemption(betSize);

		const transaction = new Transaction();
		transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
		transaction.feePayer = walletAdapter.publicKey;

		transaction.add(
			SystemProgram.createAccount({
				fromPubkey: walletAdapter.publicKey,
				newAccountPubkey: betKeypair.publicKey,
				lamports: rent,
				space: betSize,
				programId: this.programId
			})
		);

		transaction.add(
			this.program.instruction.placeBet(new BN(betAmount), betOnYes, {
				accounts: {
					contract: contractPubkey,
					bet: betKeypair.publicKey,
					bettor: walletAdapter.publicKey,
					systemProgram: SystemProgram.programId
				}
			})
		);

		return { transaction, betKeypair };
	}

	async resolveContract(
		contractAddress: string,
		outcome: boolean,
		walletAdapter: any
	): Promise<Transaction> {
		const contractPubkey = new PublicKey(contractAddress);
		const provider = await this.initializeProvider(walletAdapter);

		if (!this.program) {
			this.program = new Program(this.idl, this.programId, provider);
		}

		const transaction = new Transaction();
		transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
		transaction.feePayer = walletAdapter.publicKey;

		transaction.add(
			this.program.instruction.resolveContract(outcome, {
				accounts: {
					contract: contractPubkey,
					authority: walletAdapter.publicKey
				}
			})
		);

		return transaction;
	}
}

export const solanaClient = new SolanaProgramClient(PROGRAM_ID, idl);
