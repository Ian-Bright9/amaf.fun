import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { PROGRAM_ID } from '$lib/utils/solana-constants.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export class SolanaProgramClient {
	connection: Connection;
	programId: PublicKey;

	constructor(programId: PublicKey) {
		this.connection = connection;
		this.programId = programId;
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
		signer: PublicKey
	): Promise<Transaction> {
		const contractKeypair = new PublicKey(0);

		const instruction = SystemProgram.createAccount({
			fromPubkey: signer,
			newAccountPubkey: contractKeypair,
			lamports: await this.connection.getMinimumBalanceForRentExemption(1000),
			space: 1000,
			programId: this.programId
		});

		return new Transaction().add(instruction);
	}

	async placeBet(
		contractAddress: string,
		betAmount: number,
		betOnYes: boolean,
		signer: PublicKey
	): Promise<Transaction> {
		const contractPubkey = new PublicKey(contractAddress);

		const instruction = SystemProgram.transfer({
			fromPubkey: signer,
			toPubkey: contractPubkey,
			lamports: betAmount
		});

		return new Transaction().add(instruction);
	}

	async resolveContract(
		contractAddress: string,
		outcome: boolean,
		signer: PublicKey
	): Promise<Transaction> {
		const contractPubkey = new PublicKey(contractAddress);

		const instruction = SystemProgram.transfer({
			fromPubkey: contractPubkey,
			toPubkey: signer,
			lamports: 0
		});

		return new Transaction().add(instruction);
	}
}

export const solanaClient = new SolanaProgramClient(PROGRAM_ID);
