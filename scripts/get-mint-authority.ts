import { Connection, PublicKey } from '@solana/web3.js';

const MINT_ADDRESS = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG');

async function getMintInfo() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const mintInfo = await connection.getParsedAccountInfo(MINT_ADDRESS);
  
  if (mintInfo.value && mintInfo.value.data) {
    const data = mintInfo.value.data as any;
    const parsed = data.parsed;
    
    console.log('Mint:', MINT_ADDRESS.toString());
    console.log('\nParsed Info:');
    console.log('Mint Authority:', parsed.info.mintAuthority);
    console.log('Supply:', parsed.info.supply);
    console.log('Decimals:', parsed.info.decimals);
    console.log('Is Initialized:', parsed.info.isInitialized);
    console.log('Freeze Authority:', parsed.info.freezeAuthority);
  }
}

getMintInfo().catch(console.error);
