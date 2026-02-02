import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW';

async function testProgramData() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const programId = new PublicKey(PROGRAM_ID);

  // Get program data address
  const accountInfo = await connection.getAccountInfo(programId);
  const programDataAddress = PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')
  )[0];

  console.log('Program data address:', programDataAddress.toString());

  // Get program data account info
  const programDataInfo = await connection.getAccountInfo(programDataAddress);
  console.log('Program data length:', programDataInfo?.data.length);
  console.log('Program data owner:', programDataInfo?.owner.toString());

  // Try to get program logs
  const data = programDataInfo?.data;
  if (data) {
    // Skip the slot and offset bytes (first 8 bytes)
    const actualData = data.slice(13);
    console.log('Actual program data length:', actualData.length);
    // First few bytes might contain instruction selector
    console.log('First 16 bytes (hex):', actualData.slice(0, 16).toString('hex'));
  }
}

testProgramData().catch(console.error);
