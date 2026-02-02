import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BorshAccountsCoder, BorshInstructionCoder } from '@coral-xyz/anchor';

const PROGRAM_ID = 'BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn';

const main = async () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Load keypair from default Solana wallet
  const secretKey = JSON.parse(readFileSync(process.env.ANCHOR_WALLET || '/home/popebenny/.config/solana/id.json', 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));

  console.log("Payer address:", payer.publicKey.toString());

  // Find PDAs
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    new PublicKey(PROGRAM_ID)
  );

  const [authorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    new PublicKey(PROGRAM_ID)
  );

  console.log("Mint PDA:", mintPda.toString());
  console.log("Authority PDA:", authorityPda.toString());

  // Compute discriminator
  const discriminator = createHash('sha256').update('global:initializeMint').digest().slice(0, 8);
  console.log("Discriminator (hex):", discriminator.toString('hex'));

  // Create the instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: mintPda, isSigner: false, isWritable: true },
      { pubkey: authorityPda, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(PROGRAM_ID),
    data: discriminator,
  });

  // Create and send the transaction
  const transaction = new Transaction().add(instruction);
  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    console.log("Transaction signature:", signature);
    console.log("Mint initialized!");

    // Verify the mint exists
    const accountInfo = await connection.getAccountInfo(mintPda);
    console.log("Mint account exists:", !!accountInfo);
    console.log("Mint account owner:", accountInfo?.owner.toString());
  } catch (error: any) {
    console.error("Error:", error.message);
    if (error.logs) {
      console.error("Logs:", error.logs);
    }
  }
};

main().catch(console.error);
