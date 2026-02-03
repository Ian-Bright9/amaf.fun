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
import { createHash } from 'crypto';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');

function createInstructionDiscriminator(name: string): Buffer {
  const prefix = 'global:';
  const hash = createHash('sha256').update(prefix + name).digest();
  return hash.slice(0, 8);
}

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

  // Create instruction discriminator for initializeMint
  const discriminator = createInstructionDiscriminator('initializeMint');
  console.log("Discriminator (hex):", discriminator.toString('hex'));

  // Instruction data is just the discriminator (no args)
  const ixData = discriminator;

  // Create the instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: mintPda, isSigner: false, isWritable: true },
      { pubkey: authorityPda, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false },
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
