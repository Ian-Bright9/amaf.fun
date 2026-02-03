#!/usr/bin/env node

/**
 * Test to verify the IDL fix for claim_daily_amaf instruction
 * This tests that the program can properly encode the instruction without errors
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load IDL
const IDL: Idl = JSON.parse(
  readFileSync(join(__dirname, "src/lib/idl/amafcoin.json"), "utf8"),
);

// Constants
const PROGRAM_ID = new PublicKey(IDL.address);
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const ATA_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

// Helper functions
function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("mint")], PROGRAM_ID);
}

function getProgramAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    PROGRAM_ID,
  );
}

function getClaimStatePDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("claim"), user.toBuffer()],
    PROGRAM_ID,
  );
}

function getUserTokenAccount(user: PublicKey, mint: PublicKey): PublicKey {
  try {
    return getAssociatedTokenAddressSync(mint, user);
  } catch (e) {
    // Fallback: try with allowOwnerOffCurve
    return getAssociatedTokenAddressSync(mint, user, true);
  }
}

// Test function
async function testIdlFix() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  TEST: IDL FIX VERIFICATION                          ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");

  console.log("Program ID:", PROGRAM_ID.toString());
  console.log("Instructions in IDL:", IDL.instructions.map((i) => i.name).join(", "));
  console.log("");

  // Check if claim_daily_amaf instruction exists
  const claimInstruction = IDL.instructions.find(
    (i) => i.name === "claim_daily_amaf",
  );

  if (!claimInstruction) {
    console.error("❌ FAIL: 'claim_daily_amaf' instruction not found in IDL");
    process.exit(1);
  }

  console.log("✅ PASS: 'claim_daily_amaf' instruction found in IDL");

  // Create mock wallet and provider
  const testWallet = "Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg";
  const userWallet = new PublicKey(testWallet);

  const [mintAddress] = getMintPDA();
  const [claimStatePda] = getClaimStatePDA(userWallet);
  const [authorityPda] = getProgramAuthorityPDA();
  const userTokenAccount = getUserTokenAccount(userWallet, mintAddress);

  console.log("");
  console.log("┌─ Test Account Configuration ──────────────────────────┐");
  console.log("│ Mint:", mintAddress.toString());
  console.log("│ Program Authority:", authorityPda.toString());
  console.log("│ User:", userWallet.toString());
  console.log("│ User Token Account:", userTokenAccount.toString());
  console.log("│ Claim State:", claimStatePda.toString());
  console.log("└────────────────────────────────────────────────────────┘");
  console.log("");

  // Try to create Program instance and build instruction
  try {
    const connection = new Connection("https://api.devnet.solana.com");

    const mockWallet = {
      publicKey: userWallet,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    };

    const provider = new AnchorProvider(connection, mockWallet, {
      commitment: "confirmed",
    });

    const program = new Program(IDL, provider);

    console.log("┌─ Building claim_daily_amaf Instruction ────────────────┐");

    // Try to build the instruction - this is where the original error occurred
    const instruction = await program.methods
      .claimDailyAmaf()
      .accounts({
        mint: mintAddress,
        programAuthority: authorityPda,
        userToken: userTokenAccount,
        claimState: claimStatePda,
        user: userWallet,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ATA_PROGRAM_ID,
        systemProgram: new PublicKey(
          "11111111111111111111111111111111",
        ),
      })
      .instruction();

    console.log("│ ✅ Instruction built successfully");
    console.log("│ ✅ No 'Cannot read properties of undefined' error");
    console.log("│ ✅ IDL is correctly formatted");
    console.log("└────────────────────────────────────────────────────────┘");
    console.log("");

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║  ✅ ALL TESTS PASSED                                  ║");
    console.log("║                                                      ║");
    console.log("║  The IDL fix is working correctly!                   ║");
    console.log("║  The claim_daily_amaf instruction can be encoded.       ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    process.exit(0);
  } catch (error: any) {
    console.error("");
    console.error("❌ FAIL: Error building instruction");
    console.error("");
    console.error("Error:", error.message);
    console.error("");

    if (error.message.includes("Cannot read properties of undefined")) {
      console.error("This is the original error we're trying to fix!");
      console.error("The IDL is still not correctly loaded.");
    } else if (error.message.includes("encode")) {
      console.error("Instruction encoding error - IDL format issue");
    }

    process.exit(1);
  }
}

testIdlFix();
