import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { readFileSync } from 'fs';
import * as anchor from '@coral-xyz/anchor';
import { BorshCoder } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const PROGRAM_ID = new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn');

const main = async () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load the keypair from the default Solana wallet
  const secretKey = JSON.parse(readFileSync(process.env.ANCHOR_WALLET || '/home/popebenny/.config/solana/id.json', 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log("Payer address:", payer.publicKey.toString());

  // Find PDAs
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    PROGRAM_ID
  );

  const [authorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    PROGRAM_ID
  );

  console.log("Mint PDA:", mintPda.toString());
  console.log("Authority PDA:", authorityPda.toString());

  // Read the IDL
  const idl = JSON.parse(readFileSync("./src/lib/idl/amafcoin.json", "utf8"));
  
  // Create a BorshCoder instance
  const coder = new BorshCoder(idl);
  
  // Encode the instruction data for initializeMint
  // The instruction has no arguments, so we just pass an empty object
  const ixData = coder.instruction.encode('initializeMint', {});
  console.log("Instruction data length:", ixData.length);
  console.log("Instruction data (hex):", ixData.toString('hex'));

  // Create the instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: mintPda, isSigner: false, isWritable: true },
      { pubkey: authorityPda, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: ixData,
  });

  // Create and send the transaction
  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  
  console.log("Transaction signature:", signature);
  console.log("Mint initialized!");
};

main().catch(console.error);
