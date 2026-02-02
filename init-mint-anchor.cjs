const anchor = require('@coral-xyz/anchor');
const fs = require('fs');
const idl = require('./src/lib/idl/amafcoin.json');

async function main() {
  const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');
  
  const secretKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || '/home/popebenny/.config/solana/id.json', 'utf8'));
  const keypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(secretKey));
  
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment: 'confirmed' });
  anchor.setProvider(provider);
  
  const programId = new anchor.web3.PublicKey('Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW');
  const program = new anchor.Program(idl, programId, provider);
  
  console.log("Wallet address:", provider.wallet.publicKey.toString());
  
  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    programId
  );
  
  const [authorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    programId
  );
  
  console.log("Mint PDA:", mintPda.toString());
  console.log("Authority PDA:", authorityPda.toString());
  
  try {
    const tx = await program.methods
      .initializeMint()
      .accounts({
        mint: mintPda,
        programAuthority: authorityPda,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: new anchor.web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log("Transaction signature:", tx);
    console.log("Mint initialized successfully!");
    
    const accountInfo = await connection.getAccountInfo(mintPda);
    console.log("Mint exists:", !!accountInfo);
  } catch (error) {
    console.error("Error:", error);
    if (error.logs) {
      console.error("Logs:", error.logs);
    }
  }
}

main().catch(console.error);
