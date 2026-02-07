import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const AUTHORITY_PUBKEY = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg');

console.log('Authority:', AUTHORITY_PUBKEY.toBase58());
console.log('Program:', PROGRAM_ID.toBase58());

// Check user markets counter PDA
const userMarketsCounter = PublicKey.findProgramAddressSync(
  [Buffer.from('user_markets'), AUTHORITY_PUBKEY.toBuffer()],
  PROGRAM_ID
);
console.log('\nUser Markets Counter PDA:', userMarketsCounter[0].toBase58());
console.log('Expected from tx: D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ');
console.log('Match:', userMarketsCounter[0].toBase58() === 'D5jHB79fneZzkLWk31Zz1D589rMbRzGj8cMbhYagXniZ');

// Check mint PDA
const mintPda = PublicKey.findProgramAddressSync(
  [Buffer.from('mint')],
  PROGRAM_ID
);
console.log('\nMint PDA:', mintPda[0].toBase58());
console.log('Expected from tx: 4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6');
console.log('Match:', mintPda[0].toBase58() === '4o7kE4BkRdAkaudShPwJpoWECHRu3uoCcHZiQC1PFrc6');

// Check market PDA for index 0
const marketIndexBytes = Buffer.alloc(2);
marketIndexBytes.writeUInt16LE(0, 0);

const marketPda = PublicKey.findProgramAddressSync(
  [Buffer.from('market'), AUTHORITY_PUBKEY.toBuffer(), marketIndexBytes],
  PROGRAM_ID
);
console.log('\nMarket PDA (index 0):', marketPda[0].toBase58());
console.log('Expected from tx: 5cw8F9u3RfhCQGLGoAbN8A7VaWS9hgWte6333NmyniUr');
console.log('Match:', marketPda[0].toBase58() === '5cw8F9u3RfhCQGLGoAbN8A7VaWS9hgWte6333NmyniUr');
