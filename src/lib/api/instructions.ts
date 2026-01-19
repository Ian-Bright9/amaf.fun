import type { Program } from '@project-serum/anchor';
import BN from 'bn.js';
import { SystemProgram } from '@solana/web3.js';
import type { PublicKey, TransactionInstruction } from '@solana/web3.js';

export function createCreateContractInstruction(
	program: Program,
	contractKeypair: PublicKey,
	authority: PublicKey,
	question: string,
	description: string,
	expirationTimestamp: number
): TransactionInstruction {
	return program.instruction.createContract(question, description, new BN(expirationTimestamp), {
		accounts: {
			contract: contractKeypair,
			authority: authority,
			systemProgram: SystemProgram.programId
		}
	});
}

export function createPlaceBetInstruction(
	program: Program,
	contract: PublicKey,
	betKeypair: PublicKey,
	bettor: PublicKey,
	betAmount: number,
	betOnYes: boolean
): TransactionInstruction {
	return program.instruction.placeBet(new BN(betAmount), betOnYes, {
		accounts: {
			contract: contract,
			bet: betKeypair,
			bettor: bettor,
			systemProgram: SystemProgram.programId
		}
	});
}

export function createResolveContractInstruction(
	program: Program,
	contract: PublicKey,
	authority: PublicKey,
	outcome: boolean
): TransactionInstruction {
	return program.instruction.resolveContract(outcome, {
		accounts: {
			contract: contract,
			authority: authority
		}
	});
}

export function createInitializeTokenMintInstruction(
	program: Program,
	tokenState: PublicKey,
	authority: PublicKey
): TransactionInstruction {
	return program.instruction.initializeTokenMint({
		accounts: {
			tokenState: tokenState,
			authority: authority
		}
	});
}

export function createClaimDailyTokensInstruction(
	program: Program,
	tokenMint: PublicKey,
	tokenState: PublicKey,
	userTokenAccount: PublicKey,
	authority: PublicKey,
	tokenProgram: PublicKey
): TransactionInstruction {
	return program.instruction.claimDailyTokens({
		accounts: {
			tokenMint: tokenMint,
			tokenState: tokenState,
			userTokenAccount: userTokenAccount,
			authority: authority,
			tokenProgram: tokenProgram
		}
	});
}
