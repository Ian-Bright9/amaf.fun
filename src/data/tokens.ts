import { PublicKey, TransactionInstruction, Connection } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token'

const PROGRAM_ID = new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn')

export function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    PROGRAM_ID
  )
}

export function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    PROGRAM_ID
  )
}

export function getUserTokenAccount(
  user: PublicKey,
  mint: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(mint, user)
}

export function getEscrowTokenAccount(
  market: PublicKey,
  mint: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(mint, market, true)
}

export async function getOrCreateUserTokenAccount(
  user: PublicKey,
  mint: PublicKey,
  connection: Connection,
  payer: PublicKey
): Promise<{ address: PublicKey; instruction: TransactionInstruction | null }> {
  const ata = getAssociatedTokenAddressSync(mint, user)

  try {
    const accountInfo = await connection.getAccountInfo(ata)
    if (accountInfo) {
      return { address: ata, instruction: null }
    }
  } catch (error) {
  }

  const instruction = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    user,
    mint
  )

  return { address: ata, instruction }
}

export function getClaimStatePDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('claim'), user.toBuffer()],
    PROGRAM_ID
  )
}
