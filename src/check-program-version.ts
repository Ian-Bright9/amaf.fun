import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');

console.log('Checking deployed program...');
console.log('Program ID:', PROGRAM_ID.toBase58());
console.log();

// Get program account info
const programInfo = await connection.getAccountInfo(PROGRAM_ID);
console.log('Program account info:');
console.log('  Owner:', programInfo?.owner.toBase58());
console.log('  Executable:', programInfo?.executable);
console.log('  Lamports:', programInfo?.lamports);
console.log('  Data length:', programInfo?.data.length);
console.log();

if (programInfo?.data.length === 0) {
  console.log('Program has no data - this is normal for native programs');
  console.log();
  console.log('IMPORTANT: The deployed program may not match current lib.rs');
  console.log('To fix this, you need to redeploy the program:');
  console.log('  cd /home/popebenny/amaf/amaf.fun');
  console.log('  docker compose run --rm anchor deploy');
}
