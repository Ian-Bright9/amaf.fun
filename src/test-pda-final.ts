import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const AUTHORITY_PUBKEY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg');

const expectedMarket = 'D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ';

console.log('Testing market index 10 with various encodings:');
console.log('Expected:', expectedMarket);
console.log();

// Test u16 Little Endian encoding
for (let i = 0; i <= 20; i++) {
  const marketIndexBytesLE = Buffer.alloc(2);
  marketIndexBytesLE.writeUInt16LE(i, 0);
  
  const result = PublicKey.findProgramAddressSync(
    [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer(), marketIndexBytesLE],
    PROGRAM_ID
  );
  
  if (result[0].toBase58() === expectedMarket) {
    console.log('✓ MATCH! Index:', i);
    console.log('  Little Endian:', marketIndexBytesLE.toString('hex'));
    console.log('  PDA:', result[0].toBase58());
  }
}

console.log('\n\nNow calculating for index 11:');
for (let i = 11; i <= 15; i++) {
  const marketIndexBytesLE = Buffer.alloc(2);
  marketIndexBytesLE.writeUInt16LE(i, 0);
  
  const result = PublicKey.findProgramAddressSync(
    [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer(), marketIndexBytesLE],
    PROGRAM_ID
  );
  
  console.log(`Index ${i}:`, result[0].toBase58());
}
