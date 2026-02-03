import { 
  Connection, 
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { 
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  PublicKey as MetaplexPublicKey,
} from '@metaplex-foundation/js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

async function createMetadataMetaplexJS() {
  try {
    console.log('🚀 Creating metadata using Metaplex JS SDK...\n');

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
    );

    console.log('👛 Wallet:', wallet.publicKey.toString());

    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(wallet));

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

    const metadata = {
      name: 'AMAF Coin',
      symbol: 'AMAF',
      uri: 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json',
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };

    console.log('\n📊 Metadata Data:');
    console.log('   Name:', metadata.name);
    console.log('   Symbol:', metadata.symbol);
    console.log('   URI:', metadata.uri);
    console.log('\n🔨 Building CreateMetadataAccountV3 instruction...');

    const { signature } = await metaplex
      .nfts()
      .create({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
        mint: mintPubkey,
        isMutable: true,
        updateAuthority: authorityPda,
        mintAuthority: authorityPda,
      })
      .run();

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

createMetadataMetaplexJS();
