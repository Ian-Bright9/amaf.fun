import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token'

import { getMintPDA } from './tokens'

export interface TokenBalances {
  amafBalance: number
  solBalance: number
}

export async function getTokenBalances(
  publicKey: PublicKey,
  connection: Connection
): Promise<TokenBalances> {
  try {
    const [mintAddress] = getMintPDA()
    const userTokenAccount = getAssociatedTokenAddressSync(mintAddress, publicKey)

    const [amafBalance, solBalance] = await Promise.all([
      getAmmafBalance(userTokenAccount, connection),
      getSolBalance(publicKey, connection)
    ])

    return {
      amafBalance,
      solBalance
    }
  } catch (err) {
    console.error('Error fetching token balances:', err)
    return {
      amafBalance: 0,
      solBalance: 0
    }
  }
}

async function getAmmafBalance(
  tokenAccount: PublicKey,
  connection: Connection
): Promise<number> {
  try {
    const accountInfo = await connection.getAccountInfo(tokenAccount)
    if (!accountInfo) return 0

    const tokenAccountData = getAccount(connection, tokenAccount)
    const account = await tokenAccountData
    return Number(account.amount) / 10 ** 9
  } catch (err) {
    return 0
  }
}

async function getSolBalance(
  publicKey: PublicKey,
  connection: Connection
): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey)
    return balance / 10 ** 9
  } catch (err) {
    return 0
  }
}

export function formatBalance(balance: number, decimals = 2): string {
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })
}

export async function requestDevnetAirdrop(
  publicKey: PublicKey,
  connection: Connection
): Promise<string> {
  const signature = await connection.requestAirdrop(
    publicKey,
    2 * 10 ** 9
  )
  
  const latestBlockhash = await connection.getLatestBlockhash()
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
  })
  
  return signature
}
