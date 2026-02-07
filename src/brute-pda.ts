import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const AUTHORITY_PUBKEY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg');

const expectedMarket = '5cw8F9u3RfhCQGLGoAbN8A7VaWS9hgWte6333NmyniUr';
const expectedCounter = 'D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ';

console.log('Brute forcing seeds...');
console.log('Expected Market:', expectedMarket);
console.log('Expected Counter:', expectedCounter);
console.log('Program:', PROGRAM_ID.toBase58());
console.log('Authority:', AUTHORITY_PUBKEY.toBase58());
console.log();

// Try various seed combinations
const seedVariations = [
  ['market', 'authority'],
  ['market', 'authority', 'index'],
  ['user', 'markets', 'counter'],
  ['user', 'markets'],
  ['market', 'user', 'counter'],
  ['user_markets', 'authority'],
  ['user_markets_counter', 'authority'],
  ['counter', 'user', 'authority'],
  ['markets', 'user', 'authority'],
];

console.log('Testing seed variations that might produce:', expectedMarket);
console.log();

const marketIndexBytes = Buffer.alloc(2);
marketIndexBytes.writeUInt16LE(0, 0);

const seeds = [
  ['market', AUTHORITY_PUBKEY.toBuffer()],
  ['market', AUTHORITY_PUBKEY.toBuffer(), marketIndexBytes],
  [AUTHORITY_PUBKEY.toBuffer(), marketIndexBytes],
  [Buffer.from('user'), AUTHORITY_PUBKEY.toBuffer()],
  [Buffer.from('user_markets'), AUTHORITY_PUBKEY.toBuffer()],
  [Buffer.from('user_markets_counter'), AUTHORITY_PUBKEY.toBuffer()],
  [Buffer.from('counter'), AUTHORITY_PUBKEY.toBuffer()],
  [Buffer.from('markets'), AUTHORITY_PUBKEY.toBuffer()],
  [AUTHORITY_PUBKEY.toBuffer()],
];

for (const seed of seeds) {
  try {
    const result = PublicKey.findProgramAddressSync(seed, PROGRAM_ID);
    if (result[0].toBase58() === expectedMarket) {
      console.log('✓ MATCH for expectedMarket!');
      console.log('  Seeds:', seed.map(s => {
        if (Buffer.isBuffer(s)) return s.toString();
        return s.toBase58().slice(0, 8) + '...';
      }));
      console.log('  Bump:', result[1]);
    }
  } catch (e) {
    // Ignore errors
  }
}

console.log('\n\nTesting seed variations that might produce:', expectedCounter);
for (const seed of seeds) {
  try {
    const result = PublicKey.findProgramAddressSync(seed, PROGRAM_ID);
    if (result[0].toBase58() === expectedCounter) {
      console.log('✓ MATCH for expectedCounter!');
      console.log('  Seeds:', seed.map(s => {
        if (Buffer.isBuffer(s)) return s.toString();
        return s.toBase58().slice(0, 8) + '...';
      }));
      console.log('  Bump:', result[1]);
    }
  } catch (e) {
    // Ignore errors
  }
}
