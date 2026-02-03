import { 
  Connection, 
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

function serializeString(str: string): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(str.length, 0);
  return Buffer.concat([len, Buffer.from(str)]);
}

async function createMetadataManual() {
  try {
    console.log('🚀 Creating metadata with manual instruction construction...\n');

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

    const discriminator = Buffer.from([23, 174, 145, 1, 233, 251, 231, 200]);
    console.log('🔢 Discriminator (hex):', discriminator.toString('hex'));

    const name = serializeString('AMAF Coin');
    console.log('📛 Name bytes:', name.toString('hex'));

    const symbol = serializeString('AMAF');
    console.log('🏷 Symbol bytes:', symbol.toString('hex'));

    const uri = serializeString('https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json');
    console.log('🔗 URI bytes:', uri.toString('hex'));

    const sellerFeeBasisPoints = Buffer.alloc(2);
    sellerFeeBasisPoints.writeUInt16LE(0, 0);

    const creators = Buffer.alloc(4);
    creators.writeUInt32LE(0, 0); // None

    const collection = Buffer.alloc(4);
    collection.writeUInt32LE(0, 0); // None

    const uses = Buffer.alloc(4);
    uses.writeUInt32LE(0, 0); // None

    const isMutable = Buffer.from([1]);

    const collectionDetails = Buffer.alloc(4);
    collectionDetails.writeUInt32LE(0, 0); // None

    const instructionData = Buffer.concat([
      discriminator,
      name,
      symbol,
      uri,
      sellerFeeBasisPoints,
      creators,
      collection,
      uses,
      isMutable,
      collectionDetails,
    ]);

    console.log('\n📦 Instruction data length:', instructionData.length);
    console.log('📦 Full data (hex):', instructionData.toString('hex'));

    const transaction = new Transaction().add({
      keys: [
        { pubkey: metadataPda, isSigner: false, isWritable: true },
        { pubkey: mintPubkey, isSigner: false, isWritable: false },
        { pubkey: authorityPda, isSigner: true, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: authorityPda, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('11111111111111111111111111111111111'), isSigner: false, isWritable: false },
        { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
      ],
      programId: METADATA_PROGRAM_ID,
      data: instructionData,
    });

    console.log('\n📤 Sending transaction...');
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signature = await connection.sendTransaction(transaction, [wallet]);
    
    console.log('\n✅ Metadata created successfully!');
    console.log('📄 Transaction signature:', signature);
    console.log('🔍 Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log('📝 Metadata account:', metadataPda.toString());

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

createMetadataManual();
