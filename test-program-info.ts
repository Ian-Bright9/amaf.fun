import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW';

async function testProgramInfo() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const programId = new PublicKey(PROGRAM_ID);

  const accountInfo = await connection.getAccountInfo(programId);
  console.log('Program info:', accountInfo);
  console.log('Program length:', accountInfo?.data.length);
  console.log('Program owner:', accountInfo?.owner.toString());

  // Get program data
  const programData = await connection.getParsedAccountInfo(programId);
  console.log('Program parsed data:', JSON.stringify(programData, null, 2));

  // Try to get program account data
  const data = accountInfo?.data;
  if (data) {
    console.log('Program data (hex):', Buffer.from(data).toString('hex'));
  }
}

testProgramInfo().catch(console.error);
