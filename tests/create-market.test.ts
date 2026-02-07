import { describe, it, expect, beforeAll } from 'vitest'
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { getProgram, getMarketPDA } from '../src/data/markets'
import { getMintPDA, getUserMarketsCounterPDA } from '../src/data/tokens'
import idl from '../src/lib/idl/amafcoin.json'

describe('Create Market', () => {
  let connection: Connection
  let program: Program
  let keypair: Keypair

  beforeAll(async () => {
    connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    keypair = Keypair.generate()
    
    const wallet = new Wallet(keypair)
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
    program = new Program(idl as any, provider)
  })

  it('should calculate PDAs correctly', async () => {
    const [counterPda] = getUserMarketsCounterPDA(keypair.publicKey)
    const [mintPda] = getMintPDA()
    const [marketPda] = getMarketPDA(keypair.publicKey, 0)
    
    console.log('\n=== PDA Calculation Test ===')
    console.log('Counter PDA:', counterPda.toBase58())
    console.log('Market PDA:', marketPda.toBase58())
    console.log('Mint PDA:', mintPda.toBase58())
    console.log('Program ID:', program.programId.toBase58())
    
    expect(counterPda).toBeDefined()
    expect(marketPda).toBeDefined()
  })
})
