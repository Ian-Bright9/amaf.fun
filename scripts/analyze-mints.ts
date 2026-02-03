import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Mint from the error message
const mintFromError = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG');

// Program's mint PDA
const [programMintPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('mint')],
  PROGRAM_ID
);

async function analyze() {
  const connection = new Connection('https://api.devnet.solana.com');

  console.log('=== Mint Analysis ===\n');

  console.log('MINT 1 (from error):', mintFromError.toString());
  const mint1Info = await connection.getAccountInfo(mintFromError);
  console.log('  Exists:', mint1Info ? '✓' : '✗');
  if (mint1Info) {
    console.log('  Owner:', mint1Info.owner.toString());
    console.log('  Executable:', mint1Info.executable);
    console.log('  Data length:', mint1Info.data.length);
  }

  console.log('\nMINT 2 (program PDA):', programMintPda.toString());
  const mint2Info = await connection.getAccountInfo(programMintPda);
  console.log('  Exists:', mint2Info ? '✓' : '✗');
  if (mint2Info) {
    console.log('  Owner:', mint2Info.owner.toString());
    console.log('  Executable:', mint2Info.executable);
    console.log('  Data length:', mint2Info.data.length);
  }

  console.log('\n=== Metadata PDAs ===\n');

  const [metadata1] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintFromError.toBuffer()],
    METADATA_PROGRAM_ID
  );
  console.log('Metadata for Mint 1:', metadata1.toString());
  const metadata1Info = await connection.getAccountInfo(metadata1);
  console.log('  Exists:', metadata1Info ? '✓' : '✗');

  const [metadata2] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), programMintPda.toBuffer()],
    METADATA_PROGRAM_ID
  );
  console.log('\nMetadata for Mint 2:', metadata2.toString());
  const metadata2Info = await connection.getAccountInfo(metadata2);
  console.log('  Exists:', metadata2Info ? '✓' : '✗');

  console.log('\n=== Conclusion ===');
  if (!metadata1Info) {
    console.log('❌ Metadata does not exist for Mint 1:', mintFromError.toString());
    console.log('   This is the metadata PDA you need to create.');
  }
  if (!metadata2Info && mint2Info) {
    console.log('❌ Metadata does not exist for Mint 2:', programMintPda.toString());
  }

  console.log('\nWhich mint does initialize_metadata expect?');
  console.log('The initialize_metadata function expects the program\'s mint PDA:', programMintPda.toString());
  console.log('But the missing metadata is for:', mintFromError.toString());
}

analyze().catch(console.error);
