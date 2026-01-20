import type { Program } from '@project-serum/anchor';
import BN from 'bn.js';
import { SystemProgram, type PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export function createCreateMarketInstruction(
	program: Program,
	marketKeypair: PublicKey,
	authority: PublicKey,
	question: string,
	description: string
): TransactionInstruction {
	return program.instruction.createMarket(question, description, {
		accounts: {
			market: marketKeypair,
			authority: authority,
			systemProgram: SystemProgram.programId
		}
	});
}

export function createPlaceBetInstruction(
	program: Program,
	market: PublicKey,
	betKeypair: PublicKey,
	userToken: PublicKey,
	escrowToken: PublicKey,
	user: PublicKey,
	betAmount: number,
	sideYes: boolean
): TransactionInstruction {
	return program.instruction.placeBet(new BN(betAmount), sideYes, {
		accounts: {
			market,
			bet: betKeypair,
			userToken,
			escrowToken,
			user,
			systemProgram: SystemProgram.programId,
			tokenProgram: TOKEN_PROGRAM_ID
		}
	});
}

export function createResolveMarketInstruction(
	program: Program,
	market: PublicKey,
	authority: PublicKey,
	outcomeYes: boolean
): TransactionInstruction {
	return program.instruction.resolveMarket(outcomeYes, {
		accounts: {
			market,
			authority: authority
		}
	});
}

export function createClaimDailyAmafInstruction(
	program: Program,
	mint: PublicKey,
	claimState: PublicKey,
	userToken: PublicKey,
	user: PublicKey
): TransactionInstruction {
	return program.instruction.claimDailyAmaf({
		accounts: {
			mint,
			claimState,
			userToken,
			user,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId
		}
	});
}

export function createCancelMarketInstruction(
	program: Program,
	market: PublicKey,
	authority: PublicKey
): TransactionInstruction {
	return program.instruction.cancelMarket({
		accounts: {
			market,
			authority: authority
		}
	});
}

export function createClaimPayoutInstruction(
	program: Program,
	market: PublicKey,
	bet: PublicKey,
	escrowToken: PublicKey,
	userToken: PublicKey,
	user: PublicKey
): TransactionInstruction {
	return program.instruction.claimPayout({
		accounts: {
			market,
			bet,
			escrowToken,
			userToken,
			user,
			tokenProgram: TOKEN_PROGRAM_ID
		}
	});
}
