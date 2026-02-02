import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');

async function checkChainState() {
  const mint = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG');
  const programId = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
  
  console.log('=== On-Chain State Check ===\n');
  
  // Check mint
  const mintAccount = await connection.getAccountInfo(mint);
  console.log('MINT ACCOUNT:');
  console.log('  Address:', mint.toString());
  console.log('  Exists:', mintAccount ? '✓' : '✗');
  if (mintAccount) {
    console.log('  Owner:', mintAccount.owner.toString());
    console.log('  Executable:', mintAccount.executable);
    console.log('  Data length:', mintAccount.data.length);
  }
  
  // Check program
  const programAccount = await connection.getAccountInfo(programId);
  console.log('\nPROGRAM ACCOUNT:');
  console.log('  Address:', programId.toString());
  console.log('  Exists:', programAccount ? '✓' : '✗');
  if (programAccount) {
    console.log('  Owner:', programAccount.owner.toString());
    console.log('  Executable:', programAccount.executable);
  }
  
  // Check metadata PDA
  const metadataProgramId = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), metadataProgramId.toBuffer(), mint.toBuffer()],
    metadataProgramId
  );
  
  const metadataAccount = await connection.getAccountInfo(metadataPda);
  console.log('\nMETADATA PDA:');
  console.log('  Address:', metadataPda.toString());
  console.log('  Exists:', metadataAccount ? '✓' : '✗');
  if (metadataAccount) {
    console.log('  Owner:', metadataAccount.owner.toString());
    console.log('  Data length:', metadataAccount.data.length);
  }
  
  console.log('\n=== Conclusion ===');
  if (!metadataAccount) {
    console.log('❌ Metadata account does not exist');
    console.log('\nThis is because:');
    console.log('1. The metadata was never created via initialize_metadata');
    console.log('2. OR the initialize_metadata transaction failed');
    console.log('3. OR the metadata creation using Metaplex SDK was never executed');
    console.log('\nThe mint account exists but has no associated metadata.');
  }
}

checkChainState().catch(console.error);
