import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const PROGRAM_ID = 'BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn';

const main = async () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const secretKey = JSON.parse(readFileSync(process.env.ANCHOR_WALLET || '/home/popebenny/.config/solana/id.json', 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));

  console.log("Payer address:", payer.publicKey.toString());
  console.log("Payer balance:", await connection.getBalance(payer.publicKey) / 1e9, "SOL");

  const [mintPda, mintBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    new PublicKey(PROGRAM_ID)
  );

  const [authorityPda, authorityBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    new PublicKey(PROGRAM_ID)
  );

  console.log("Mint PDA:", mintPda.toString());
  console.log("Mint Bump:", mintBump);
  console.log("Authority PDA:", authorityPda.toString());
  console.log("Authority Bump:", authorityBump);

  const discriminator = createHash('sha256').update('global:initializeMint').digest().slice(0, 8);
  console.log("Discriminator (hex):", discriminator.toString('hex'));

  const transaction = new Transaction();
  const instruction = {
    keys: [
      { pubkey: mintPda, isSigner: false, isWritable: true },
      { pubkey: authorityPda, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(PROGRAM_ID),
    data: Buffer.from(discriminator),
  };

  transaction.add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer.publicKey;

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer], { commitment: 'confirmed' });
    console.log("Transaction signature:", signature);
    console.log("Mint initialized successfully!");

    const accountInfo = await connection.getAccountInfo(mintPda);
    console.log("Mint account exists:", !!accountInfo);
    if (accountInfo) {
      console.log("Mint account owner:", accountInfo.owner.toString());
      console.log("Mint account data length:", accountInfo.data.length);
      console.log("Mint is initialized:", accountInfo.executable === false);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    if (error.logs) {
      console.error("Logs:", error.logs);
    }
  }
};

main().catch(console.error);
