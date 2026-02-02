import { Connection, PublicKey } from '@solana/web3.js';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const mintPda = new PublicKey('6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG');

const [metadataPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintPda.toBuffer()],
  METADATA_PROGRAM_ID
);

console.log('Metadata PDA:', metadataPda.toString());

const connection = new Connection('https://api.devnet.solana.com');

(async () => {
  try {
    const info = await connection.getAccountInfo(metadataPda);
    console.log('Metadata exists:', !!info);
    if (info) {
      console.log('Metadata owner:', info.owner.toString());
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
