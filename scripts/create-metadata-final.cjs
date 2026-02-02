const anchor = require("@coral-xyz/anchor");
const { Program } = require("@coral-xyz/anchor");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");
const fs = require("fs");

async function main() {
  const provider = anchor.AnchorProvider.env();

  const idl = JSON.parse(fs.readFileSync("./rust/idl.json", "utf8"));
  const program = new Program(idl, provider);

  console.log("\n=== AMAF Coin Metadata Creation ===\n");

  console.log("Step 1: Setting mint authority to user wallet");
  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  const [programAuthorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    program.programId
  );

  const userWallet = new anchor.web3.PublicKey("Cu6m9sKWsN6q6dVW6N1L271yn3iqe61HBHpA85kivqhg");

  console.log("Mint PDA:", mintPda.toString());
  console.log("Authority PDA:", programAuthorityPda.toString());
  console.log("Setting authority to:", userWallet.toString());

  const setAuthorityTx = await program.methods
    .setMintAuthority(userWallet)
    .accounts({
      mint: mintPda,
      programAuthority: programAuthorityPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("✓ Set mint authority. Signature:", setAuthorityTx);
  console.log("\nStep 2: Creating metadata with Metaplex");

  const metaplex = Metaplex.make(provider.connection);
  metaplex.use(keypairIdentity(provider.wallet));

  const nft = await metaplex
    .nfts()
    .create({
      uri: "https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/main/public/amafcoin-metadata.json",
      name: "AMAF Coin",
      symbol: "AMAF",
      sellerFeeBasisPoints: 0,
      isMutable: true,
      useExistingMint: mintPda,
    });

  console.log("✓ Metadata created. Address:", nft.metadataAddress.toString());
  console.log("\nStep 3: Restoring mint authority to PDA");

  const restoreAuthorityTx = await program.methods
    .setMintAuthority(null)
    .accounts({
      mint: mintPda,
      programAuthority: programAuthorityPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("✓ Restored mint authority. Signature:", restoreAuthorityTx);

  console.log("\n=== SUCCESS ===");
  console.log("Mint:", mintPda.toString());
  console.log("Metadata:", nft.metadataAddress.toString());
  console.log("\nView on devnet:");
  console.log(`  Mint: https://explorer.solana.com/address/${mintPda.toString()}?cluster=devnet`);
  console.log(`  Metadata: https://explorer.solana.com/address/${nft.metadataAddress.toString()}?cluster=devnet`);
  console.log("\nSet Authority Tx:", setAuthorityTx);
  console.log("Create Metadata Tx:", nft.response.signature);
  console.log("Restore Authority Tx:", restoreAuthorityTx);
}

main().catch(err => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
