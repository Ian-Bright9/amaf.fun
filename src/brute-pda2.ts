import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const AUTHORITY_PUBKEY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg');

const expectedMarket = 'D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ';

console.log('Finding seeds for:', expectedMarket);
console.log('Authority:', AUTHORITY_PUBKEY.toBase58());
console.log();

// Test market indices 0-100 with various seed formats
for (let i = 0; i <= 100; i++) {
  const marketIndexBytes = Buffer.alloc(2);
  marketIndexBytes.writeUInt16LE(i, 0);

  // Format 1: ["market", authority, index]
  try {
    const result = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer(), marketIndexBytes],
      PROGRAM_ID
    );
    if (result[0].toBase58() === expectedMarket) {
      console.log('✓ MATCH! Format ["market", authority, index]');
      console.log('  Market Index:', i);
      console.log('  Bump:', result[1]);
    }
  } catch (e) {}

  // Format 2: ["market", authority]
  try {
    const result = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer()],
      PROGRAM_ID
    );
    if (result[0].toBase58() === expectedMarket) {
      console.log('✓ MATCH! Format ["market", authority]');
      console.log('  Bump:', result[1]);
    }
  } catch (e) {}

  // Format 3: [authority, index]
  try {
    const result = PublicKey.findProgramAddressSync(
      [AUTHORITY_PUBKEY.toBuffer(), marketIndexBytes],
      PROGRAM_ID
    );
    if (result[0].toBase58() === expectedMarket) {
      console.log('✓ MATCH! Format [authority, index]');
      console.log('  Market Index:', i);
      console.log('  Bump:', result[1]);
    }
  } catch (e) {}

  // Format 4: [authority]
  try {
    const result = PublicKey.findProgramAddressSync(
      [AUTHORITY_PUBKEY.toBuffer()],
      PROGRAM_ID
    );
    if (result[0].toBase58() === expectedMarket) {
      console.log('✓ MATCH! Format [authority]');
      console.log('  Bump:', result[1]);
    }
  } catch (e) {}
}

// Try "user" seed variations
const userSeeds = [
  ['user', 'market'],
  ['user', 'markets'],
  ['user_markets'],
  ['markets', 'user'],
];

for (const seedBase of userSeeds) {
  for (let i = 0; i <= 20; i++) {
    const indexBytes = Buffer.alloc(2);
    indexBytes.writeUInt16LE(i, 0);

    const seeds = seedBase.map(s => Buffer.from(s));
    seeds.push(AUTHORITY_PUBKEY.toBuffer());

    if (seedBase.length === 2) {
      seeds.push(indexBytes);
    }

    try {
      const result = PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
      if (result[0].toBase58() === expectedMarket) {
        console.log('\n✓ MATCH!');
        console.log('  Seeds:', seedBase, 'Index:', i);
        console.log('  Bump:', result[1]);
      }
    } catch (e) {}
  }
}

console.log('\nDone searching!');
