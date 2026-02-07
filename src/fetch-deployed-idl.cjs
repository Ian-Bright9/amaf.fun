const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const connection = new Connection('https://api.devnet.solana.com');
const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const IDL_PDA = new PublicKey('8SC54wM8HFZvftBjeqTKoLsbHJG9xsh7JqnjYbU7qrPr');

console.log('Fetching deployed IDL account...');
console.log('IDL PDA:', IDL_PDA.toBase58());
console.log();

async function main() {
  try {
    const idlAccountInfo = await connection.getAccountInfo(IDL_PDA);

    if (!idlAccountInfo || idlAccountInfo.data.length === 0) {
      console.log('IDL account not found or has no data');
      process.exit(1);
    }

    console.log('IDL account data length:', idlAccountInfo.data.length);
    console.log();

    // The IDL data is typically at offset 8 (after discriminator)
    const idlData = idlAccountInfo.data.slice(8);
    const idlJson = idlData.toString('utf-8');

    console.log('IDL JSON:');
    console.log(idlJson);

    // Save to file
    const outputPath = path.join(__dirname, '../src/lib/idl/deployed-amafcoin.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(JSON.parse(idlJson), null, 2));
    console.log();
    console.log('IDL saved to:', outputPath);
    console.log();
    console.log('Now update src/data/markets.ts to import from deployed IDL instead of local IDL');
    console.log('Change line 3 from:');
    console.log('  import idl from "@/lib/idl/amafcoin.json"');
    console.log('to:');
    console.log('  import idl from "@/lib/idl/deployed-amafcoin.json"');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
