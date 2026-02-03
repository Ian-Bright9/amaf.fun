import { 
  Connection, 
  PublicKey, 
  Keypair,
  SystemProgram,
} from '@solana/web3.js';
import { 
  Program, 
  AnchorProvider, 
  web3,
  Wallet,
} from '@coral-xyz/anchor';
import IDL from './src/lib/idl/amafcoin.json' assert { type: 'json' };

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function createMetadata() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
  );

  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

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

  console.log('Creating metadata...');
  console.log('Mint:', mintPda.toString());
  console.log('Authority:', authorityPda.toString());
  console.log('Metadata:', metadataPda.toString());
  console.log('Payer:', wallet.publicKey.toString());

  const tx = await program.methods
    .initializeMetadata(
      'AMAF Coin',
      'AMAF',
      'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'
    )
    .accounts({
      mint: mintPda,
      programAuthority: authorityPda,
      metadataAccount: metadataPda,
      payer: wallet.publicKey,
      metadataProgram: METADATA_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log('✅ Metadata created! Transaction:', tx);
  console.log('Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

createMetadata().catch(console.error);
