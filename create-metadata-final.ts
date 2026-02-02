import { 
  Connection, 
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

function stringToBytes(str: string): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(str.length, 0);
  return Buffer.concat([len, Buffer.from(str)]);
}

function createMetadataInstruction(
  mint: PublicKey,
  metadata: PublicKey,
  authority: PublicKey,
  payer: PublicKey
): Buffer {
  const discriminator = Buffer.from([33, 15, 223, 89, 229, 234, 172, 153]);
  
  const name = stringToBytes('AMAF Coin');
  const symbol = stringToBytes('AMAF');
  const uri = stringToBytes('https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json');
  
  const sellerFeeBasisPoints = Buffer.alloc(2);
  sellerFeeBasisPoints.writeUInt16LE(0, 0);
  
  const creatorsNone = Buffer.alloc(4);
  creatorsNone.writeUInt32LE(0, 0);
  
  const collectionNone = Buffer.alloc(4);
  collectionNone.writeUInt32LE(0, 0);
  
  const usesNone = Buffer.alloc(4);
  usesNone.writeUInt32LE(0, 0);
  
  const isMutable = Buffer.alloc(1);
  isMutable.writeUInt8(1, 0);
  
  const collectionDetailsNone = Buffer.alloc(4);
  collectionDetailsNone.writeUInt32LE(0, 0);
  
  return Buffer.concat([
    discriminator,
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creatorsNone,
    collectionNone,
    usesNone,
    isMutable,
    collectionDetailsNone,
  ]);
}

async function createMetadata() {
  try {
    console.log('🚀 Creating metadata with manual instruction...\n');

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
    );

    console.log('👛 Wallet:', wallet.publicKey.toString());

    const mintPubkey = new PublicKey('4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6');
    console.log('🪙 Mint:', mintPubkey.toString());

    const [authorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      PROGRAM_ID
    );
    console.log('🔐 Authority PDA:', authorityPda.toString());

    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );
    console.log('📝 Metadata PDA:', metadataPda.toString());

    const instructionData = createMetadataInstruction(
      mintPubkey,
      metadataPda,
      authorityPda,
      wallet.publicKey
    );

    console.log('📦 Instruction data length:', instructionData.length);
    console.log('📦 Discriminator:', Array.from(instructionData.subarray(0, 8)).join(', '));

    const transaction = new Transaction().add({
      keys: [
        { pubkey: metadataPda, isSigner: false, isWritable: true },
        { pubkey: mintPubkey, isSigner: false, isWritable: false },
        { pubkey: authorityPda, isSigner: true, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: authorityPda, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111111'), isSigner: false, isWritable: false },
      ],
      programId: METADATA_PROGRAM_ID,
      data: instructionData,
    });

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    console.log('📤 Sending transaction...');
    const signature = await connection.sendTransaction(transaction, [wallet]);
    
    console.log('✅ Metadata created successfully!');
    console.log('📄 Transaction signature:', signature);
    console.log('🔍 Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log('📝 Metadata account:', metadataPda.toString());

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

createMetadata();
