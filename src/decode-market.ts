import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');

const marketData = Buffer.from('277VNwDjxpqwyUXE4xbecD8TZ9oMXE1oTHW+/b6E+fqlQVJjf8HlLwoA/AsAAAB0ZXN0IG1hcmtldAUAAAB0ZXN0CgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64');

console.log('Market data length:', marketData.length);
console.log('Market data (hex):', marketData.toString('hex').slice(0, 200));

// Try to decode discriminator (first 8 bytes)
const discriminator = marketData.slice(0, 8);
console.log('\nDiscriminator (hex):', discriminator.toString('hex'));
console.log('Discriminator (decimal):', Array.from(discriminator));

// From IDL, Market discriminator should be [219, 190, 213, 55, 0, 227, 198, 154]
const expectedMarketDiscriminator = [219, 190, 213, 55, 0, 227, 198, 154];
console.log('Expected Market discriminator:', expectedMarketDiscriminator);
console.log('Match:', JSON.stringify(Array.from(discriminator)) === JSON.stringify(expectedMarketDiscriminator));

// UserMarketsCounter discriminator: [127, 35, 208, 139, 90, 20, 242, 7]
const expectedCounterDiscriminator = [127, 35, 208, 139, 90, 20, 242, 7];
console.log('\nExpected Counter discriminator:', expectedCounterDiscriminator);

// Try to decode as UserMarketsCounter
const counterAuthority = new PublicKey(marketData.slice(8, 40));
const counterCount = marketData.readUInt16LE(40);
console.log('\nIf UserMarketsCounter:');
console.log('  Authority:', counterAuthority.toBase58());
console.log('  Count:', counterCount);

// Calculate PDA with this authority
const testPda = PublicKey.findProgramAddressSync(
  [Buffer.from('user_markets'), counterAuthority.toBuffer()],
  PROGRAM_ID
);
console.log('  Calculated PDA:', testPda[0].toBase58());
console.log('  Expected PDA: D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ');
