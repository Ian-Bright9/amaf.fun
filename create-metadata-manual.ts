import { 
  Connection, 
  PublicKey, 
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');

const INITIALIZE_METADATA_DISCRIMINATOR = Buffer.from([
  35, 215, 241, 156, 122, 208, 206, 212
]);

function serializeString(str: string): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(str.length, 0);
  return Buffer.concat([len, Buffer.from(str)]);
}

function buildInitializeMetadataInstruction(
  mint: PublicKey,
  programAuthority: PublicKey,
  metadataAccount: PublicKey,
  payer: PublicKey,
  metadataProgram: PublicKey,
  systemProgram: PublicKey,
  tokenProgram: PublicKey,
  rent: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction {
  const data = Buffer.concat([
    INITIALIZE_METADATA_DISCRIMINATOR,
    serializeString(name),
    serializeString(symbol),
    serializeString(uri),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: programAuthority, isSigner: false, isWritable: true },
      { pubkey: metadataAccount, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: metadataProgram, isSigner: false, isWritable: false },
      { pubkey: systemProgram, isSigner: false, isWritable: false },
      { pubkey: tokenProgram, isSigner: false, isWritable: false },
      { pubkey: rent, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

async function createMetadata() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
  );

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
  console.log('Payer:', keypair.publicKey.toString());

  const instruction = buildInitializeMetadataInstruction(
    mintPda,
    authorityPda,
    metadataPda,
    keypair.publicKey,
    METADATA_PROGRAM_ID,
    SYSTEM_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    RENT_PUBKEY,
    'AMAF Coin',
    'AMAF',
    'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'
  );

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;

  const signature = await connection.sendTransaction(transaction, [keypair]);
  await connection.confirmTransaction(signature);

  console.log('✅ Metadata created! Transaction:', signature);
  console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

createMetadata().catch(console.error);
