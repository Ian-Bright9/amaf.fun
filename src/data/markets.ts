import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import idl from '@/lib/idl/amafcoin.json'

export const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')

export interface Market {
  publicKey: PublicKey
  authority: PublicKey
  bump: number
  question: string
  description: string
  resolved: boolean
  outcome: boolean
  totalYes: bigint
  totalNo: bigint
}

export async function getProgram(
  connection: Connection,
  wallet: any
): Promise<Program> {
  const provider = new AnchorProvider(
    connection,
    { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction, signAllTransactions: wallet.signAllTransactions },
    AnchorProvider.defaultOptions()
  )
  return new Program(idl as any, provider)
}

export async function getMarkets(
  connection: Connection,
  wallet: any
): Promise<Market[]> {
  try {
    const program = await getProgram(connection, wallet)
    const markets = await (program.account as any).market.all()
    return markets.map((account: any) => ({
      publicKey: account.publicKey,
      authority: account.account.authority as PublicKey,
      bump: account.account.bump as number,
      question: account.account.question as string,
      description: account.account.description as string,
      resolved: account.account.resolved as boolean,
      outcome: account.account.outcome as boolean,
      totalYes: account.account.totalYes as bigint,
      totalNo: account.account.totalNo as bigint,
    }))
  } catch (error) {
    console.error('Error fetching markets:', error)
    return []
  }
}

export function getMarketPDA(
  authority: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market'), authority.toBuffer()],
    programId
  )
}

export function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    PROGRAM_ID
  )
}
