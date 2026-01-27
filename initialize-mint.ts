import * as anchor from "@coral-xyz/anchor";
import { readFileSync } from "fs";

const main = async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idl = JSON.parse(readFileSync("./rust/idl.json", "utf8"));

  console.log("Program ID from IDL:", idl.address);
  console.log("Program ID type:", typeof idl.address);
  console.log("IDL metadata keys:", Object.keys(idl.metadata));
  console.log("Expected Program ID: BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn");

  const programId = new anchor.web3.PublicKey("BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn");
  const program = new anchor.Program(idl, programId, provider);

  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  const [authorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    program.programId
  );

  console.log("Initializing mint at:", mintPda.toString());

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
  console.log("Mint initialized!");
};

main().catch(console.error);
