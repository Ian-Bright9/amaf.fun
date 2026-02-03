import { Connection, Keypair, clusterApiUrl, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { readFileSync } from 'fs';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const USER_WALLET = new PublicKey('Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg');

const connection = new Connection(clusterApiUrl('devnet'));

async function main() {
  console.log('Setting mint authority...\n');
  
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf-8')))
  );
  
  const mintPda = PublicKey.findProgramAddressSync([Buffer.from('mint')], PROGRAM_ID);
  const programAuthorityPda = PublicKey.findProgramAddressSync([Buffer.from('authority')], PROGRAM_ID);
  console.log('Mint PDA:', mintPda[0].toString());
  console.log('Program Authority PDA:', programAuthorityPda[0].toString());
  console.log('Bump:', programAuthorityPda[1]);
  
  const setAuthorityData = Buffer.from(
    Uint8Array.from([67, 127, 155, 187, 100, 174, 103, 121]) // discriminator
  );
  
  const newAuthorityBytes = Buffer.alloc(32);
  newAuthorityBytes.set(new PublicKey(USER_WALLET).toBuffer(), 0);
  
  const instructionData = Buffer.concat([setAuthorityData, newAuthorityBytes]);
  
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: mintPda[0], isSigner: false, isWritable: true },
      { pubkey: programAuthorityPda[0], isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: instructionData,
  });
  
  const transaction = new Transaction();
  transaction.add(instruction);
  
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;
  
  transaction.sign(keypair);
  
  const pdaSigner = {
    publicKey: programAuthorityPda[0],
    secretKey: Buffer.from(''),
  };
  
  console.log('Sending transaction...');
  const signature = await connection.sendTransaction(transaction, [keypair, pdaSigner as any]);
  console.log('✓ Success:', signature);
  console.log('\nView on explorer:');
  console.log(`  https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
