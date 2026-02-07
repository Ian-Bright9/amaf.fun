import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const AUTHORITY_PUBKEY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg');

console.log('Authority:', AUTHORITY_PUBKEY.toBase58());
console.log('Program:', PROGRAM_ID.toBase58());

// Try different seed formats for user markets counter
console.log('\n--- Testing User Markets Counter Seeds ---');

// Version 1: "user_markets"
const v1 = PublicKey.findProgramAddressSync(
  [Buffer.from('user_markets'), AUTHORITY_PUBKEY.toBuffer()],
  PROGRAM_ID
);
console.log('Seed "user_markets":', v1[0].toBase58());

// Version 2: "user_markets_counter"  
const v2 = PublicKey.findProgramAddressSync(
  [Buffer.from('user_markets_counter'), AUTHORITY_PUBKEY.toBuffer()],
  PROGRAM_ID
);
console.log('Seed "user_markets_counter":', v2[0].toBase58());

// Version 3: just authority
const v3 = PublicKey.findProgramAddressSync(
  [AUTHORITY_PUBKEY.toBuffer()],
  PROGRAM_ID
);
console.log('Seed [authority]:', v3[0].toBase58());

console.log('\nExpected from tx: D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ');

// Now test market seeds
console.log('\n--- Testing Market Seeds ---');

// Try just authority (without index)
const mv1 = PublicKey.findProgramAddressSync(
  [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer()],
  PROGRAM_ID
);
console.log('Seed ["market", authority]:', mv1[0].toBase58());

// With index 0
const marketIndexBytes = Buffer.alloc(2);
marketIndexBytes.writeUInt16LE(0, 0);

const mv2 = PublicKey.findProgramAddressSync(
  [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer(), marketIndexBytes],
  PROGRAM_ID
);
console.log('Seed ["market", authority, index(0)]:', mv2[0].toBase58());

console.log('\nExpected from tx: 5cw8F9u3RfhCQGLGoAbN8A7VaWS9hgWte6333NmyniUr');
