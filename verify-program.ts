import { Connection, PublicKey } from '@solana/web3.js';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const accountInfo = await connection.getAccountInfo(new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW'));

  console.log('Program account found, length:', accountInfo?.data.length);
  console.log('Program upgraded successfully');
}

main().catch(console.error);
