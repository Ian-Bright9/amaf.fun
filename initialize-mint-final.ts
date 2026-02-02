import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');

function createInstructionDiscriminator(name: string): Buffer {
  const prefix = 'global:';
  const hash = createHash('sha256').update(prefix + name).digest();
  return hash.slice(0, 8);
}

const main = async () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Load keypair from default Solana wallet
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

  // Create instruction discriminator for initializeMint
  const discriminator = createInstructionDiscriminator('initializeMint');
  console.log("Discriminator (hex):", discriminator.toString('hex'));

  // Instruction data is just discriminator (no args)
  const ixData = discriminator;

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
    programId: PROGRAM_ID,
    data: ixData,
  });

  // Create and send the transaction
  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);

  console.log("Transaction signature:", signature);
  console.log("Mint initialized!");

  // Verify the mint exists
  const accountInfo = await connection.getAccountInfo(mintPda);
  console.log("Mint account exists:", !!accountInfo);
  console.log("Mint account owner:", accountInfo?.owner.toString());
};

main().catch(console.error);
