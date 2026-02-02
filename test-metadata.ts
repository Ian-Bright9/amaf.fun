import { 
  Connection, 
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');

async function testInitializeMetadata() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
    );

  console.log('🧪 Testing initialize_metadata instruction...\n');

  const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint')],
      PROGRAM_ID
    );

  const [authorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      PROGRAM_ID
    );

  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

  console.log('Mint PDA:', mintPda.toString());
  console.log('Authority PDA:', authorityPda.toString());
  console.log('Metadata PDA:', metadataPda.toString());
  console.log('Payer:', wallet.publicKey.toString());

  const discriminator = Buffer.from([35, 215, 241, 156, 122, 208, 206, 212]);
  const data = Buffer.concat([
    discriminator,
    Buffer.from([0x09, 0x00, 0x00, 0x00]), // name length = 9
    Buffer.from([0x41, 0x4d, 0x41, 0x46, 0x20, 0x43, 0x6f, 0x69, 0x6e]), // "AMAF Coin"
    Buffer.from([0x04, 0x00, 0x00, 0x00]), // symbol length = 4
    Buffer.from([0x41, 0x4d, 0x41, 0x46]), // "AMAF"
    Buffer.from([0x28, 0x00, 0x00, 0x00]), // URI length = 40
    Buffer.from('https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json'),
    Buffer.from([0x00, 0x00]), // sellerFeeBasisPoints = 0
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // creators = None (0)
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // collection = None (0)
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // uses = None (0)
    Buffer.from([0x01]), // is_mutable = 1
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // collection_details = None (0)
  ]);

  console.log('\nInstruction data length:', data.length);
  console.log('Discriminator:', Array.from(discriminator).join(', '));

  const transaction = new Transaction().add({
    keys: [
      { pubkey: mintPda, isSigner: false, isWritable: true },
      { pubkey: authorityPda, isSigner: false, isWritable: true },
      { pubkey: metadataPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'), isSigner: false, isWritable: false },
      { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false },
      { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: data,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  console.log('\nSending transaction...');
  const signature = await connection.sendTransaction(transaction, [wallet]);
  
  console.log('\n✅ Transaction sent!');
  console.log('Signature:', signature);
  console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

  const confirmation = await connection.confirmTransaction(signature);
  console.log('\nTransaction confirmed:', confirmation.value);
  console.log('Error:', confirmation.value?.err);
}

testInitializeMetadata().catch(console.error);
