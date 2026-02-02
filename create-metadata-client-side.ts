import { 
  Connection, 
  Keypair, 
  PublicKey, 
} from '@solana/web3.js';
import { 
  createUmi,
  keypairIdentity,
  publicKey,
} from '@metaplex-foundation/umi-bundle-defaults';
import { 
  createMetadataAccountV3,
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from '@metaplex-foundation/umi-web3js-adapters';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');

async function createTokenMetadataClientSide() {
  const connection = new Connection('https://api.devnet.solana.com');
  
  const payer = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || ''))
  );

  console.log('Payer:', payer.publicKey.toString());

  const umi = createUmi(connection).use(keypairIdentity(fromWeb3JsKeypair(payer)));

  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    PROGRAM_ID
  );
  console.log('Mint PDA:', mintPda.toString());

  const [authorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    PROGRAM_ID
  );
  console.log('Authority PDA:', authorityPda.toString());

  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPda.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  console.log('Metadata PDA:', metadataPda.toString());

  const umiMetadataPda = fromWeb3JsPublicKey(metadataPda);
  const umiMintPda = fromWeb3JsPublicKey(mintPda);
  const umiAuthorityPda = fromWeb3JsPublicKey(authorityPda);

  await createMetadataAccountV3(umi, {
    metadata: umiMetadataPda,
    mint: umiMintPda,
    authority: umiAuthorityPda,
    updateAuthority: umiAuthorityPda,
    data: {
      name: 'AMAF Coin',
      symbol: 'AMAF',
      uri: 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json',
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);

  console.log('✅ Metadata created!');
  console.log('Explorer:', `https://explorer.solana.com/address/${metadataPda.toString()}?cluster=devnet`);
}

createTokenMetadataClientSide().catch(console.error);
