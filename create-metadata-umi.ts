import { 
  Connection, 
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { 
  createUmi,
  none,
} from '@metaplex-foundation/umi-bundle-defaults';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

async function createMetadataUmi() {
  try {
    console.log('🚀 Creating metadata using Metaplex UMI SDK...\n');

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
    );

    console.log('👛 Wallet:', wallet.publicKey.toString());

    const umi = createUmi(connection).use(fromWeb3JsKeypair(wallet));

    const mintPubkey = fromWeb3JsPublicKey(new PublicKey('4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6'));
    console.log('🪙 Mint:', new PublicKey(mintPubkey).toString());

    const authorityPda = fromWeb3JsPublicKey(
      PublicKey.findProgramAddressSync(
        [Buffer.from('authority')],
        PROGRAM_ID
      )[0]
    );
    console.log('🔐 Authority PDA:', new PublicKey(authorityPda).toString());

    const metadataPda = fromWeb3JsPublicKey(
      PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(mintPubkey).toBuffer(),
        ],
        METADATA_PROGRAM_ID
      )[0]
    );
    console.log('📝 Metadata PDA:', new PublicKey(metadataPda).toString());

    console.log('\n📊 Metadata Data:');
    console.log('   Name: AMAF Coin');
    console.log('   Symbol: AMAF');
    console.log('   URI: https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json');
    console.log('\n🔨 Building CreateMetadataAccountV3 instruction...');

    const builder = createMetadataAccountV3(umi, {
      metadata: metadataPda,
      mint: mintPubkey,
      mintAuthority: authorityPda,
      updateAuthority: authorityPda,
      data: {
        name: 'AMAF Coin',
        symbol: 'AMAF',
        uri: 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json',
        sellerFeeBasisPoints: 0,
        creators: none(),
        collection: none(),
        uses: none(),
      },
      isMutable: true,
      collectionDetails: none(),
    });

    console.log('✅ Instruction builder created');
    console.log('📤 Sending transaction...');

    const result = await builder.sendAndConfirm(umi);

    console.log('✅ Metadata created successfully!');
    console.log('📄 Transaction signature:', result.signature);
    console.log('🔍 Explorer:', `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
    console.log('📝 Metadata account:', new PublicKey(metadataPda).toString());

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

createMetadataUmi();
