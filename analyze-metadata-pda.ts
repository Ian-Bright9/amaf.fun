import { Connection, PublicKey } from '@solana/web3.js';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// The metadata address from the error
const metadataAddress = new PublicKey('ELaAwEQsZJg5aLACpJdyYxgpoosbv9vHEYZCu8MmBbjF');

// Reverse engineer: find which mint this metadata is for
// Metadata PDA = ["metadata", METADATA_PROGRAM_ID, mint]

console.log('Analyzing metadata PDA: ELaAwEQsZJg5aLACpJdyYxgpoosbv9vHEYZCu8MmBbjF\n');

// Try to find the mint by checking common mint addresses from the project
const commonMints = [
  '6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG', // Known mint from check-metadata.ts
  '4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6', // Another mint from check-metadata.ts
];

async function checkPDA() {
  const connection = new Connection('https://api.devnet.solana.com');

  console.log('Checking against known mint addresses:\n');

  for (const mint of commonMints) {
    const [derivedMetadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        new PublicKey(mint).toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    const isMatch = derivedMetadata.toString() === metadataAddress.toString();
    console.log(`Mint: ${mint}`);
    console.log(`  Derived metadata: ${derivedMetadata.toString()}`);
    console.log(`  Match: ${isMatch ? '✓ YES' : '✗ NO'}\n`);
  }

  console.log('Checking if the metadata account exists on-chain...');
  const accountInfo = await connection.getAccountInfo(metadataAddress);

  if (accountInfo) {
    console.log('✅ Metadata account EXISTS');
    console.log('   Owner:', accountInfo.owner.toString());
    console.log('   Data length:', accountInfo.data.length);
  } else {
    console.log('❌ Metadata account DOES NOT EXIST');
  }
}

checkPDA().catch(console.error);
