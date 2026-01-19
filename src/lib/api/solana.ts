import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { PROGRAM_ID, DEFAULT_NETWORK } from '$lib/utils/solana-constants.js';
import {
	createCreateContractInstruction,
	createPlaceBetInstruction,
	createResolveContractInstruction
} from './instructions.js';

const connection = new Connection(DEFAULT_NETWORK, 'confirmed');

export class SolanaProgramClient {
	connection: Connection;
	programId: PublicKey;
	program: Program | null = null;

	constructor(programId: PublicKey) {
		this.connection = connection;
		this.programId = programId;
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

	async initializeProgram(provider: AnchorProvider, idl: any) {
		this.program = new Program(idl, this.programId, provider);
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
			throw new Error('Program not initialized');
		}

		const transaction = new Transaction();
		transaction.add(
			SystemProgram.createAccount({
				fromPubkey: walletAdapter.publicKey,
				newAccountPubkey: contractKeypair.publicKey,
				lamports: await this.connection.getMinimumBalanceForRentExemption(1000),
				space: 1000,
				programId: this.programId
			})
		);

		const createInstruction = createCreateContractInstruction(
			this.program,
			contractKeypair.publicKey,
			walletAdapter.publicKey,
			question,
			description,
			expirationTimestamp
		);

		transaction.add(createInstruction);

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
			throw new Error('Program not initialized');
		}

		const transaction = new Transaction();
		transaction.add(
			SystemProgram.createAccount({
				fromPubkey: walletAdapter.publicKey,
				newAccountPubkey: betKeypair.publicKey,
				lamports: await this.connection.getMinimumBalanceForRentExemption(200),
				space: 200,
				programId: this.programId
			})
		);

		const betInstruction = createPlaceBetInstruction(
			this.program,
			contractPubkey,
			betKeypair.publicKey,
			walletAdapter.publicKey,
			betAmount,
			betOnYes
		);

		transaction.add(betInstruction);

		return { transaction, betKeypair };
	}

	async resolveContract(
		contractAddress: string,
		outcome: boolean,
		walletAdapter: any
	): Promise<Transaction> {
		const contractPubkey = new PublicKey(contractAddress);

		if (!this.program) {
			throw new Error('Program not initialized');
		}

		const resolveInstruction = createResolveContractInstruction(
			this.program,
			contractPubkey,
			walletAdapter.publicKey,
			outcome
		);

		return new Transaction().add(resolveInstruction);
	}
}

export const solanaClient = new SolanaProgramClient(PROGRAM_ID);
