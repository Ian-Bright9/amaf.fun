import * as anchor from "@coral-xyz/anchor";
import { readFileSync } from "fs";

const main = async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idl = JSON.parse(readFileSync("./rust/idl.json", "utf8"));

  console.log("Program ID from IDL:", idl.metadata.address);
  const program = new anchor.Program(idl, provider);

  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  const [authorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    program.programId
  );

  console.log("Initializing mint at:", mintPda.toString());
  console.log("Authority PDA:", authorityPda.toString());

  try {
    const tx = await program.methods
      .initializeMint()
      .accounts({
        mint: mintPda,
        programAuthority: authorityPda,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Transaction signature:", tx);
    console.log("Mint initialized successfully!");

    const accountInfo = await provider.connection.getAccountInfo(mintPda);
    console.log("Mint account exists:", !!accountInfo);
    if (accountInfo) {
      console.log("Mint account owner:", accountInfo.owner.toString());
    }
  } catch (error: any) {
    console.error("Error initializing mint:", error.message);
    if (error.logs) {
      console.error("Logs:", error.logs);
    }
    throw error;
  }
};

main().catch(console.error);
