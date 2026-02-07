import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import idl from '@/lib/idl/amafcoin.json'
import { getMintPDA } from './tokens'

export const PROGRAM_ID = new PublicKey('DGnE4VRytTjTfghAdvUosZoF7bDYetXSEX6WeYF2LeUe')

export enum MarketType {
  Binary = 0,
  MultiOption = 1,
}

export enum Outcome {
  Unresolved = 0,
  Cancelled = 1,
  OptionWinner = 2,
}

export interface MarketOption {
  shares: bigint
  name: string
  active: boolean
}

export interface Market {
  publicKey: PublicKey
  authority: PublicKey
  marketIndex: number
  bump: number
  marketType: MarketType
  question: string
  description: string
  resolved: boolean
  outcome: number
  options: MarketOption[]
  numOptions: number
  collateralBalance: bigint
  virtualLiquidity: bigint
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
      marketIndex: account.account.marketIndex as number,
      bump: account.account.bump as number,
      marketType: account.account.marketType as MarketType,
      question: account.account.question as string,
      description: account.account.description as string,
      resolved: account.account.resolved as boolean,
      outcome: account.account.outcome as number,
      options: (account.account.options as any[]).map((opt: any) => ({
        shares: BigInt(opt.shares.toString()),
        name: opt.name as string,
        active: opt.active as boolean,
      })),
      numOptions: account.account.numOptions as number,
      collateralBalance: BigInt(account.account.collateralBalance.toString()),
      virtualLiquidity: BigInt(account.account.virtualLiquidity.toString()),
    }))
  } catch (error) {
    console.error('Error fetching markets:', error)
    return []
  }
}

export function getMarketPDA(
  authority: PublicKey,
  marketIndex: number,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market'), authority.toBuffer(), Buffer.from(new Uint16Array([marketIndex]).buffer)],
    programId
  )
}

export function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    PROGRAM_ID
  )
}

export async function ensureMintInitialized(
  connection: Connection,
  wallet: any
): Promise<boolean> {
  try {
    const [mintPda] = getMintPDA()
    const [authorityPda] = getProgramAuthorityPDA()

    const program = await getProgram(connection, wallet)

    const accountInfo = await connection.getAccountInfo(mintPda)
    if (accountInfo) {
      const isValidMint = accountInfo.owner.equals(TOKEN_PROGRAM_ID) || accountInfo.owner.equals(PROGRAM_ID)
      if (isValidMint) {
        return true
      }
    }

    await program.methods
      .initializeMint()
      .accounts({
        mint: mintPda,
        programAuthority: authorityPda,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        rent: 'SysvarRent111111111111111111111111111111111',
      })
      .rpc({ commitment: 'confirmed' })

    return true
  } catch (err) {
    console.error('Error initializing mint:', err)
    throw err
  }
}
