import {
  Connection,
  Keypair,
  PublicKey,
  Transaction
} from '@solana/web3.js';
import { Program, AnchorProvider, web3, Wallet } from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import idl from './src/lib/idl/amafcoin.json';

const PROGRAM_ID = new PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');

class KeypairWallet implements Wallet {
  constructor(public payer: Keypair) {}

  async signTransaction<T extends Transaction>(tx: T): Promise<T> {
    tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions<T extends Transaction>(txs: T[]): Promise<T[]> {
    return txs.map(tx => {
      tx.partialSign(this.payer);
      return tx;
    });
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
}

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Load keypair from default Solana wallet
  const secretKey = JSON.parse(readFileSync(process.env.ANCHOR_WALLET || '/home/popebenny/.config/solana/id.json', 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));

  const wallet = new KeypairWallet(payer);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(idl as any, PROGRAM_ID, provider);

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

  try {
    const tx = await program.methods
      .initializeMint()
      .accounts({
        mint: mintPda,
        programAuthority: authorityPda,
        payer: payer.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    // Verify the mint exists
    const accountInfo = await connection.getAccountInfo(mintPda);
    console.log("Mint account exists:", !!accountInfo);
    console.log("Mint account owner:", accountInfo?.owner.toString());
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
