import * as anchor from '@coral-xyz/anchor'
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { getMintPDA, getProgramAuthorityPDA } from './src/data/tokens'

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW')

async function initializeMint() {
  try {
    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)

    console.log('Provider wallet:', provider.wallet.publicKey.toString())

    const idl = await anchor.Program.fetchIdl(PROGRAM_ID, provider)
    if (!idl) {
      throw new Error('IDL not found for program')
    }

    const program = new anchor.Program(idl, provider)

    const [mintPda] = getMintPDA()
    const [authorityPda] = getProgramAuthorityPDA()

    console.log('Mint PDA:', mintPda.toString())
    console.log('Authority PDA:', authorityPda.toString())

    console.log('\nInitializing mint...')
    const tx = await program.methods
      .initializeMint()
      .accounts({
        mint: mintPda,
        programAuthority: authorityPda,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc()

    console.log('✅ Mint initialized successfully!')
    console.log('Transaction signature:', tx)
    console.log('Mint address:', mintPda.toString())

  } catch (error) {
    console.error('Error initializing mint:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    process.exit(1)
  }
}

initializeMint()
