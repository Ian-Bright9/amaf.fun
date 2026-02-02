import { 
  Connection, 
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { 
  Program, 
  AnchorProvider,
} from '@coral-xyz/anchor';
import IDL from './src/lib/idl/amafcoin.json' assert { type: 'json' };

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function createMetadataViaAnchor() {
  try {
    console.log('🚀 Creating metadata via Anchor program...\n');

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    const wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
    );

    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: (tx) => {
          wallet.signTransaction(tx);
          return tx;
        },
        signAllTransactions: (txs) => {
          return txs.map(tx => wallet.signTransaction(tx));
        },
      },
      { commitment: 'confirmed' }
    );

    const program = new Program(IDL as any, PROGRAM_ID, provider);

    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint')],
      PROGRAM_ID
    );

    const [authorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      PROGRAM_ID
    );

    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    console.log('📊 Accounts:');
    console.log('   Program ID:', PROGRAM_ID.toString());
    console.log('   Mint PDA:', mintPda.toString());
    console.log('   Authority PDA:', authorityPda.toString());
    console.log('   Metadata PDA:', metadataPda.toString());
    console.log('   Payer (wallet):', wallet.publicKey.toString());

    console.log('\n📋 Calling initialize_metadata instruction...');
    console.log('   Name: AMAF Coin');
    console.log('   Symbol: AMAF');
    console.log('   URI: https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json\n');

    const tx = await program.methods
      .initializeMetadata(
        'AMAF Coin',
        'AMAF',
        'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json',
      )
      .accounts({
        mint: mintPda,
        programAuthority: authorityPda,
        metadataAccount: metadataPda,
        payer: wallet.publicKey,
        metadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('✅ Metadata created successfully!');
    console.log('📄 Transaction signature:', tx);
    console.log('🔍 Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check that program was deployed successfully');
    console.error('   2. Verify all account PDAs are correct');
    console.error('   3. Ensure initialize_metadata instruction exists in program');
    process.exit(1);
  }
}

createMetadataViaAnchor();
