import { 
  Connection, 
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import * as fs from 'fs';

const MINT_ADDRESS = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function createMetadata() {
  try {
    console.log('🔧 Creating metadata using Metaplex SDK...\n');

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load wallet from the default path
    const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`;
    console.log('Wallet path:', walletPath);
    
    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet not found at ${walletPath}`);
    }

    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    );

    console.log('Wallet:', walletKeypair.publicKey.toString());
    console.log('Mint:', MINT_ADDRESS.toString());

    // Initialize Metaplex
    const metaplex = Metaplex.make(connection).use(keypairIdentity(walletKeypair));

    // Derive the metadata PDA
    const metadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: MINT_ADDRESS });

    console.log('Metadata PDA:', metadataPDA.toString());
    console.log('Expected:', 'ELaAwEQsZJg5aLACpJdyYxgpoosbv9vHEYZCu8MmBbjF');
    console.log('Match:', metadataPDA.toString() === 'ELaAwEQsZJg5aLACpJdyYxgpoosbv9vHEYZCu8MmBbjF' ? '✓' : '✗');

    // Check if metadata already exists
    const existingMetadata = await connection.getAccountInfo(metadataPDA);
    if (existingMetadata) {
      console.log('\n✅ Metadata already exists!');
      console.log('Owner:', existingMetadata.owner.toString());
      console.log('Data length:', existingMetadata.data.length);
      return;
    }

    console.log('\nCreating metadata account...');
    
    // Use Metaplex to create metadata for existing mint
    // Note: This requires the wallet to be the mint authority
    const { nft } = await metaplex
      .nfts()
      .create({
        name: 'AMAF Coin',
        symbol: 'AMAF', 
        uri: 'https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json',
        sellerFeeBasisPoints: 0,
        isMutable: true,
        useNewMint: false, // Use existing mint
        mintAddress: MINT_ADDRESS,
      });

    console.log('\n✅ Metadata created successfully!');
    console.log('Metadata address:', nft.metadataAddress.toString());
    console.log('\nExplorer: https://explorer.solana.com/address/' + nft.metadataAddress.toString() + '?cluster=devnet');

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    throw error;
  }
}

createMetadata()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
