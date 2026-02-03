#!/usr/bin/env node

/**
 * Initialize the AMAF mint on the new program deployment
 * 
 * Usage: npx tsx init-mint-new-program.ts
 */

import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// New program ID
const PROGRAM_ID = new PublicKey(
  "Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW"
);

// Load IDL
const IDL = JSON.parse(
  readFileSync(join(__dirname, "src/lib/idl/amafcoin.json"), "utf8")
);

// PDA Helper Functions
function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("mint")], PROGRAM_ID);
}

function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    PROGRAM_ID
  );
}

async function initializeMint() {
  // Get wallet from environment or file
  const homedir = process.env.HOME || require('os').homedir();
  const walletKeypairPath = process.env.WALLET_KEYPAIR || 
    join(homedir, ".config/solana/id.json");
  
  console.log("Looking for wallet at:", walletKeypairPath);
  
  let walletKeypair;
  try {
    const keypairData = JSON.parse(readFileSync(walletKeypairPath, "utf8"));
    // Solana keypair file contains the secret key bytes (64 bytes)
    const secretKey = new Uint8Array(keypairData);
    walletKeypair = Keypair.fromSecretKey(secretKey);
  } catch (e) {
    console.error("❌ Error loading wallet:", e.message);
    console.error("   Make sure you have a wallet at ~/.config/solana/id.json");
    console.error("   Or set WALLET_KEYPAIR environment variable");
    process.exit(1);
  }

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     INITIALIZING AMAF MINT                            ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Program ID:", PROGRAM_ID.toString());
  console.log("Wallet:", walletKeypair.publicKey.toString());
  console.log("Network: Devnet");
  console.log("");

  const [mintAddress] = getMintPDA();
  const [authorityPda] = getProgramAuthorityPDA();

  console.log("┌─ PDA Information ───────────────────────────────────┐");
  console.log("│ Mint PDA:", mintAddress.toString());
  console.log("│ Program Authority:", authorityPda.toString());
  console.log("└────────────────────────────────────────────────────┘");
  console.log("");

  // Check if mint already exists
  const mintAccount = await connection.getAccountInfo(mintAddress);
  if (mintAccount) {
    console.log("✅ Mint account already exists! No initialization needed.");
    console.log("   You can now proceed with claiming AMAF tokens.");
    return;
  }

  console.log("ℹ️  Mint does not exist. Initializing now...");
  console.log("");

  try {
    // Create wallet adapter for Anchor
    const wallet = {
      publicKey: walletKeypair.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(walletKeypair);
        return tx;
      },
      signAllTransactions: async (txs) => {
        return txs.map((tx) => {
          tx.partialSign(walletKeypair);
          return tx;
        });
      },
    };

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    const program = new Program(IDL, provider);

    console.log("┌─ Building Transaction ──────────────────────────────┐");
    
    const tx = await program.methods
      .initializeMint()
      .accounts({
        mint: mintAddress,
        programAuthority: authorityPda,
        payer: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        rent: "SysvarRentB1111111111111111111111111111111",
      })
      .rpc();

    console.log("│ ✅ Transaction sent successfully!");
    console.log("│");
    console.log("│ Signature:", tx);
    console.log("│");
    console.log("│ View on Solana Explorer:");
    console.log("│ https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
    console.log("└────────────────────────────────────────────────────┘");
    console.log("");
    console.log("🎉 Mint initialization complete!");
    console.log("   You can now claim AMAF tokens at http://localhost:3001");

  } catch (error) {
    console.error("");
    console.error("❌ Error initializing mint:");
    console.error(error);
    console.error("");
    console.error("Make sure:");
    console.error("1. Your wallet has devnet SOL (get some at https://faucet.solana.com)");
    console.error("2. The program is deployed to devnet");
    console.error("3. You're using the correct program ID");
    process.exit(1);
  }
}

// Run the initialization
initializeMint();
