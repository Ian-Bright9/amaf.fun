#!/usr/bin/env node

/**
 * Test script to verify Daily AMAF Claim functionality
 *
 * Usage: node test-claim.mjs <WALLET_PUBLIC_KEY>
 * Example: node test-claim.mjs HrfWPEubmDdc7pTtmhFv3wzR24c7pEFzBbMnknfbB5hz
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getMintPDA,
  getProgramAuthorityPDA,
  getClaimStatePDA,
  getOrCreateUserTokenAccount,
} from "./src/data/tokens.js";
import { getProgram } from "./src/data/markets.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROGRAM_ID = "Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW";
const IDL = JSON.parse(
  readFileSync(join(__dirname, "src/lib/idl/amafcoin.json"), "utf8"),
);

async function testClaim(walletAddress) {
  const connection = new Connection("https://api.devnet.solana.com");
  const userWallet = new PublicKey(walletAddress);

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     TESTING DAILY AMAF CLAIM FUNCTIONALITY            ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Wallet:", userWallet.toString());
  console.log("Program:", PROGRAM_ID);
  console.log("Network: Devnet");
  console.log("");

  try {
    // Get PDAs
    const [mintAddress] = getMintPDA();
    const [claimStatePda] = getClaimStatePDA(userWallet);
    const [authorityPda] = getProgramAuthorityPDA();

    console.log("┌─ Account Information ───────────────────────────────┐");
    console.log("│ Mint:", mintAddress.toString());
    console.log("│ Claim State PDA:", claimStatePda.toString());
    console.log("│ Program Authority:", authorityPda.toString());
    console.log("└────────────────────────────────────────────────────┘");
    console.log("");

    // Check user's token account
    const userTokenResult = await getOrCreateUserTokenAccount(
      userWallet,
      mintAddress,
      connection,
      userWallet,
    );

    console.log("┌─ Token Account Status ──────────────────────────────┐");
    console.log("│ User Token Account:", userTokenResult.address.toString());

    // Check if token account exists
    const tokenAccountInfo = await connection.getAccountInfo(
      userTokenResult.address,
    );
    if (tokenAccountInfo) {
      console.log("│ Status: ✅ Already exists");
    } else {
      console.log("│ Status: ⚠️  Will be created");
    }
    console.log("└────────────────────────────────────────────────────┘");
    console.log("");

    // Check claim state
    console.log("┌─ Claim State Check ─────────────────────────────────┐");
    const claimStateInfo = await connection.getAccountInfo(claimStatePda);

    if (claimStateInfo) {
      // Parse last_claim timestamp (after 8 byte discriminator + 32 byte pubkey)
      const lastClaimTimestamp = Number(claimStateInfo.data.readBigInt64LE(40));
      const lastClaim = new Date(lastClaimTimestamp * 1000);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();

      console.log("│ Last claim:", lastClaim.toISOString());
      console.log("│ Next claim available:", nextClaim.toISOString());

      if (nextClaim > now) {
        const minutesRemaining = Math.floor(
          (nextClaim.getTime() - now.getTime()) / 1000 / 60,
        );
        console.log("│");
        console.log("│ ⚠️  CANNOT CLAIM YET");
        console.log("│    Time remaining:", minutesRemaining, "minutes");
        console.log("└────────────────────────────────────────────────────┘");
        return;
      } else {
        console.log("│ Status: ✅ Ready to claim (24h cooldown passed)");
      }
    } else {
      console.log("│ Status: ℹ️  First time claim (no previous state)");
    }
    console.log("└────────────────────────────────────────────────────┘");
    console.log("");

    // Build the claim transaction
    console.log("┌─ Building Transaction ──────────────────────────────┐");

    // Create mock wallet for building transaction
    const mockWallet = {
      publicKey: userWallet,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };

    const program = await getProgram(connection, mockWallet);

    const claimIx = await program.methods
      .claimDailyAmaf()
      .accounts({
        mint: mintAddress,
        programAuthority: authorityPda,
        userToken: userTokenResult.address,
        claimState: claimStatePda,
        user: userWallet,
        tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        associatedTokenProgram: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // Build complete transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: userWallet,
    });

    // Add ATA creation if needed
    if (userTokenResult.instruction) {
      transaction.add(userTokenResult.instruction);
      console.log("│ Added: Token account creation instruction");
    }

    transaction.add(claimIx);
    console.log("│ Added: Claim instruction");
    console.log("│ Transaction built successfully");
    console.log("└────────────────────────────────────────────────────┘");
    console.log("");

    // Simulate the transaction
    console.log("┌─ Simulating Transaction ────────────────────────────┐");
    try {
      const simulationResult = await connection.simulateTransaction(
        transaction,
        {
          sigVerify: false,
          replaceRecentBlockhash: true,
        },
      );

      if (simulationResult.value.err) {
        console.log("│ ❌ SIMULATION FAILED");
        console.log("│");
        console.log(
          "│ Error:",
          JSON.stringify(simulationResult.value.err, null, 2),
        );

        if (simulationResult.value.logs) {
          console.log("│");
          console.log("│ Recent Logs:");
          const relevantLogs = simulationResult.value.logs
            .filter(
              (log) =>
                log.includes("Error") ||
                log.includes("failed") ||
                log.includes("invoke"),
            )
            .slice(-8);

          relevantLogs.forEach((log) => {
            if (log.length > 75) {
              console.log("│   ", log.substring(0, 72) + "...");
            } else {
              console.log("│   ", log);
            }
          });
        }
      } else {
        console.log("│ ✅ SIMULATION SUCCESSFUL!");
        console.log("│");
        console.log(
          "│ Compute units used:",
          simulationResult.value.unitsConsumed?.toLocaleString() || "N/A",
        );
        console.log("│");
        console.log("│ 🎉 You can successfully claim 100 AMAF!");
      }
      console.log("└────────────────────────────────────────────────────┘");
    } catch (simError) {
      console.log("│ ❌ Simulation error:", simError.message);
      if (simError.logs) {
        console.log("│ Logs:");
        simError.logs.slice(-5).forEach((log) => console.log("│   ", log));
      }
      console.log("└────────────────────────────────────────────────────┘");
    }

    console.log("");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║  To execute the real claim:                            ║");
    console.log("║  1. Open http://localhost:3001                         ║");
    console.log("║  2. Connect your wallet                                ║");
    console.log('║  3. Click "Claim ¤100" button                          ║');
    console.log("╚════════════════════════════════════════════════════════╝");
  } catch (error) {
    console.error("");
    console.error("❌ Error during test:", error.message);
    console.error("");
    if (error.stack) {
      console.error("Stack trace:");
      console.error(error.stack.split("\n").slice(0, 5).join("\n"));
    }
    process.exit(1);
  }
}

// Get wallet address from command line
const walletAddress = "Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg";

if (!walletAddress) {
  console.error("❌ Error: Please provide a wallet public key");
  console.error("");
  console.error("Usage: node test-claim.mjs <WALLET_PUBLIC_KEY>");
  console.error(
    "Example: node test-claim.mjs HrfWPEubmDdc7pTtmhFv3wzR24c7pEFzBbMnknfbB5hz",
  );
  console.error("");
  process.exit(1);
}

// Validate the address
try {
  new PublicKey(walletAddress);
} catch {
  console.error("❌ Error: Invalid public key format");
  process.exit(1);
}

// Run the test
testClaim(walletAddress);
