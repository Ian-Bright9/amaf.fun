import { Connection, PublicKey } from '@solana/web3.js';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const MINT_ADDRESS = new PublicKey('4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6');
const AUTHORITY_PDA = new PublicKey('J1ujJTz5zPWhWLTBZAYNaM1yMyauLDiFrRqNaKBVTvQJ');
const PAYER = new PublicKey('HAvuKp2tM1XLdTEFetjB7RwMfeFdR5iYmJkJ1qTnMZGs');

// Calculate metadata PDA
const [metadataPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    MINT_ADDRESS.toBuffer(),
  ],
  METADATA_PROGRAM_ID
);

console.log('Metadata PDA:', metadataPDA.toString());

// Create the instruction using Metaplex SDK
const instruction = createCreateMetadataAccountV3Instruction(
  {
    metadata: metadataPDA,
    mint: MINT_ADDRESS,
    mintAuthority: AUTHORITY_PDA,
    payer: PAYER,
    updateAuthority: AUTHORITY_PDA,
  },
  {
    createMetadataAccountArgsV3: {
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
    },
  }
);

console.log('\nInstruction Data (hex):', instruction.data.toString('hex'));
console.log('Instruction Data (base64):', instruction.data.toString('base64'));
console.log('Instruction Data length:', instruction.data.length);

console.log('\nAccounts:');
instruction.keys.forEach((key, i) => {
  console.log(`  ${i}: ${key.pubkey.toString()} (writable: ${key.isWritable}, signer: ${key.isSigner})`);
});

// Parse the discriminator (first 8 bytes)
const discriminator = instruction.data.slice(0, 8);
console.log('\nDiscriminator (hex):', discriminator.toString('hex'));
console.log('Discriminator (array):', Array.from(discriminator));
