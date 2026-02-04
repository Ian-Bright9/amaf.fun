import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token'

import { PROGRAM_ID } from './markets'

export function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    PROGRAM_ID
  )
}

export function getClaimStatePDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('claim'), user.toBuffer()],
    PROGRAM_ID
  )
}

export function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    PROGRAM_ID
  )
}

export function getUserMarketsCounterPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_markets'), authority.toBuffer()],
    PROGRAM_ID
  )
}

export function getEscrowTokenAccount(market: PublicKey, mint: PublicKey): PublicKey {
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), market.toBuffer()],
    PROGRAM_ID
  )
  return getAssociatedTokenAddressSync(mint, escrowPda)
}

export function getBetPDA(market: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), market.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  )
}

export async function getOrCreateUserTokenAccount(
  wallet: PublicKey,
  mint: PublicKey,
  connection: any,
  payer: PublicKey
): Promise<{ address: PublicKey; instruction: TransactionInstruction | null }> {
  const userToken = getAssociatedTokenAddressSync(mint, wallet)

  const accountInfo = await connection.getAccountInfo(userToken)
  if (accountInfo === null) {
    // Account doesn't exist, create it
    const instruction = createAssociatedTokenAccountInstruction(
      payer,
      userToken,
      wallet,
      mint
    )
    return { address: userToken, instruction }
  }

  // Account exists
  return { address: userToken, instruction: null }
}
