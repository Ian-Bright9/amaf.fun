import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";

describe("create-metadata", () => {
  it("should set mint authority, create metadata, and restore authority", async () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const idl = JSON.parse(require("fs").readFileSync("./rust/idl.json", "utf8"));
    const program = new Program(idl, provider);

    console.log("\n=== Step 1: Setting mint authority to user wallet ===");
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
    console.log("\n=== Step 2: Creating metadata with Metaplex ===\n");

    const metaplex = Metaplex.make(provider.connection);
    metaplex.use(keypairIdentity(provider.wallet));

    const { nft } = await metaplex
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
    console.log("\n=== Step 3: Restoring mint authority to PDA ===\n");

    const restoreAuthorityTx = await program.methods
      .setMintAuthority(null as any)
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
  });
});
