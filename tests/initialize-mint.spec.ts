import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { readFileSync } from "fs";

describe("initialize-mint", () => {
  it("should initialize the mint", async () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const idl = JSON.parse(readFileSync("./rust/idl.json", "utf8"));
    const program = new Program(idl, provider);

    console.log("Program ID:", program.programId.toString());

    const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );

    const [authorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      program.programId
    );

    console.log("Mint PDA:", mintPda.toString());
    console.log("Authority PDA:", authorityPda.toString());

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

    console.log("Transaction:", tx);
  });
});
