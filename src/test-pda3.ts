import { PublicKey } from '@solana/web3.js';

const AUTHORITY_PUBKEY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg');

console.log('Authority:', AUTHORITY_PUBKEY.toBase58());

// Test with various program IDs
const programIds = [
  'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW',  // From code
  '4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6',  // Mint account from tx (likely NOT the program ID)
];

for (const progIdStr of programIds) {
  const PROGRAM_ID = new PublicKey(progIdStr);
  console.log(`\nProgram ID: ${progIdStr}`);
  
  // User markets counter
  const userMarketsCounter = PublicKey.findProgramAddressSync(
    [Buffer.from('user_markets'), AUTHORITY_PUBKEY.toBuffer()],
    PROGRAM_ID
  );
  console.log('  User Markets Counter:', userMarketsCounter[0].toBase58());
  
  // Market index 0
  const marketIndexBytes = Buffer.alloc(2);
  marketIndexBytes.writeUInt16LE(0, 0);
  const marketPda = PublicKey.findProgramAddressSync(
    [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer(), marketIndexBytes],
    PROGRAM_ID
  );
  console.log('  Market (index 0):', marketPda[0].toBase58());
}

console.log('\n\nExpected from transaction:');
console.log('  User Markets Counter: D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ');
console.log('  Market: 5cw8F9u3RfhCQGLGoAbN8A7VaWS9hgWte6333NmyniUr');
