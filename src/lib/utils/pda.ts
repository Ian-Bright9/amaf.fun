import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './solana-constants.js';

const TOKEN_MINT_SEED = 'token_mint';
const TOKEN_STATE_SEED = 'token_state';

export function deriveTokenMintAddress(): PublicKey {
	const [tokenMint] = PublicKey.findProgramAddressSync([Buffer.from(TOKEN_MINT_SEED)], PROGRAM_ID);
	return tokenMint;
}

export function deriveTokenStateAddress(): PublicKey {
	const [tokenState] = PublicKey.findProgramAddressSync(
		[Buffer.from(TOKEN_STATE_SEED)],
		PROGRAM_ID
	);
	return tokenState;
}

export function deriveUserTokenAccount(userPubkey: PublicKey, tokenMint: PublicKey): PublicKey {
	const [userTokenAccount] = PublicKey.findProgramAddressSync(
		[userPubkey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
		TOKEN_PROGRAM_ID
	);
	return userTokenAccount;
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
