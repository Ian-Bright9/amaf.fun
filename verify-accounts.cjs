#!/usr/bin/env node

/**
 * Verify all required accounts exist on-chain
 */

const { Connection, PublicKey } = require('@solana/web3.js');

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const NETWORK = process.env.NETWORK || 'devnet';

async function checkAccounts() {
  const connection = new Connection(`https://api.${NETWORK}.solana.com`);
  
  console.log('Checking required accounts...');
  console.log('Program ID:', PROGRAM_ID.toString());
  console.log('Network:', NETWORK);
  console.log('');
  
  // Calculate PDAs
  const [mintPda] = PublicKey.findProgramAddressSync([Buffer.from('mint')], PROGRAM_ID);
  const [authPda] = PublicKey.findProgramAddressSync([Buffer.from('authority')], PROGRAM_ID);
  
  const accounts = [
    { name: 'Program', key: PROGRAM_ID, required: true },
    { name: 'Mint PDA', key: mintPda, desc: 'Mint account', required: true },
    { name: 'Authority PDA', key: authPda, desc: 'Program authority (PDA for signing, optional)', required: false },
    { name: 'Program Data', key: '8ZmymakS1pCfj8CHBTnwsCxsb7qVchH1Ys2zZGPn81cX', desc: 'Program data account', required: true },
    { name: 'IDL Account', key: '6B3UeseiXXcDAddiWEkBvopjbZy3yDCGQigPW882bRMm', desc: 'IDL metadata', required: true },
  ];
  
  let allOk = true;
  
  for (const acc of accounts) {
    const key = typeof acc.key === 'string' ? new PublicKey(acc.key) : acc.key;
    try {
      const info = await connection.getAccountInfo(key);
      if (info) {
        console.log('✓', acc.name, '- EXISTS (' + info.data.length + ' bytes)', acc.desc ? '[' + acc.desc + ']' : '');
      } else {
        if (acc.required) {
          console.log('✗', acc.name, '- MISSING', acc.desc ? '[' + acc.desc + ']' : '');
          allOk = false;
        } else {
          console.log('ℹ', acc.name, '- NOT FOUND (optional)', acc.desc ? '[' + acc.desc + ']' : '');
        }
      }
    } catch (e) {
      console.log('✗', acc.name, '- ERROR:', e.message);
      if (acc.required) allOk = false;
    }
  }
  
  console.log('');
  if (allOk) {
    console.log('✓ All required accounts exist');
    process.exit(0);
  } else {
    console.log('✗ Some accounts are missing');
    process.exit(1);
  }
}

checkAccounts().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
