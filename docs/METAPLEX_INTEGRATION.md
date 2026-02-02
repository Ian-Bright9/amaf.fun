# Metaplex Integration for amaf.fun

This document describes the Metaplex integration added to help debug and resolve the metadata initialization issue with the AMAF token.

## Overview

The metadata initialization for the AMAF token fails with `InvalidInstructionData` error due to a serialization mismatch between Anchor 0.32.0 and Metaplex Token Metadata program. This integration provides debugging tools using the Metaplex SDK to understand and fix the issue.

## Architecture

### Docker Compose Service

A new `metaplex` service has been added to `docker-compose.yml`:

- **Image**: `node:20-slim` (standard Node.js image, no custom Dockerfile)
- **Purpose**: Provides isolated environment for Metaplex SDK operations
- **Features**:
  - Automatic dependency installation on startup
  - Persistent `node_modules` cache via Docker volume
  - Mounts Solana config for wallet access
  - Pre-configured for devnet

### Scripts

Three debugging scripts are provided in `scripts/`:

1. **`check-metadata.ts`**: Checks if metadata exists for the AMAF token
   - Displays mint and metadata account status
   - Shows explorer links
   - Reports on token functionality

2. **`validate-instruction.ts`**: Analyzes the instruction format
   - Compares program's manual construction with Metaplex SDK
   - Shows correct discriminator and data format
   - Identifies serialization differences

3. **`create-metadata-metaplex.ts`**: Attempts metadata creation via Metaplex
   - Demonstrates proper instruction construction
   - Shows why direct creation fails (PDA authority limitation)
   - Provides debugging guidance

### Makefile Commands

New commands added to `Makefile`:

```bash
# Metaplex container management
make metaplex-shell          # Open interactive shell in Metaplex container
make install-deps            # Install dependencies in Metaplex container

# Metadata diagnostics
make metaplex-check          # Check metadata status
make metaplex-validate       # Validate instruction format
make metaplex-create         # Create metadata analysis
make metaplex-diagnose       # Run all diagnostics
```

## Usage

### Quick Start

1. **Check metadata status**:
   ```bash
   make metaplex-check
   ```

2. **Validate instruction format**:
   ```bash
   make metaplex-validate
   ```

3. **Run all diagnostics**:
   ```bash
   make metaplex-diagnose
   ```

### Interactive Mode

To run custom Metaplex commands:

```bash
make metaplex-shell
# Inside container:
npx tsx scripts/check-metadata.ts
npx tsx scripts/validate-instruction.ts
npx tsx scripts/create-metadata-metaplex.ts
```

## The Metadata Problem

### Current State
- ✅ Program deployed to devnet
- ✅ Mint initialized (functional for transfers, minting, betting)
- ❌ Metadata account not created (InvalidInstructionData error)

### Root Cause
The `initialize_metadata` instruction in `programs/amafcoin/src/lib.rs` uses manual instruction construction that doesn't match Metaplex's expected Borsh serialization format.

### Why It Can't Be Fixed Without Redeployment
The mint authority is a Program Derived Address (PDA):
- Only the program can sign with the PDA
- Metaplex SDK cannot sign transactions with the PDA
- The program instruction itself has a serialization bug
- Fixing requires updating the Rust code and redeploying

### Workarounds

Since the token is functional (minting, transfers, betting work fine), metadata is only needed for wallet display:

1. **Wait for devnet airdrop reset** (24 hours), then redeploy with fixed code
2. **Fund the program deployer** with devnet SOL from another source
3. **Accept missing metadata** - token works fine without it

## Implementation Details

### Dependencies Added

```json
{
  "@metaplex-foundation/js": "^0.20.1",
  "@metaplex-foundation/mpl-token-metadata": "^3.3.0",
  "@metaplex-foundation/umi": "^0.9.2",
  "@metaplex-foundation/umi-bundle-defaults": "^0.9.2",
  "@metaplex-foundation/umi-web3js-adapters": "^0.9.2"
}
```

### Docker Compose Configuration

```yaml
metaplex:
  image: node:20-slim
  working_dir: /workspace
  volumes:
    - .:/workspace
    - ~/.config/solana:/root/.config/solana
    - node_modules_cache:/workspace/node_modules
  environment:
    - ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
    - SOLANA_URL=https://api.devnet.solana.com
    - SOLANA_CLUSTER=devnet
    - ANCHOR_WALLET=/root/.config/solana/id.json
  entrypoint: ["/bin/sh", "-c", "if [ ! -f /workspace/node_modules/.package-lock.json ] || [ /workspace/package.json -nt /workspace/node_modules/.package-lock.json ]; then npm install; fi; exec /bin/bash"]

volumes:
  node_modules_cache:
```

## Token Information

- **Mint Address**: `6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG`
- **Program ID**: `Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW`
- **Name**: AMAF Coin
- **Symbol**: AMAF
- **Metadata URI**: `https://raw.githubusercontent.com/Ian-Bright9/amaf.fun/master/metadata.json`

## Links

- [Solana Explorer - Mint](https://explorer.solana.com/address/6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG?cluster=devnet)
- [Solana Explorer - Program](https://explorer.solana.com/address/Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW?cluster=devnet)

## Troubleshooting

### Container Won't Start

If the Metaplex container fails to start:

```bash
# Clean up and rebuild
docker compose down
docker compose run --rm metaplex echo "Test"
```

### Scripts Fail to Run

If scripts fail with module errors:

```bash
# Reinstall dependencies
make install-deps
# Or manually:
docker compose run --rm metaplex npm install
```

### Wallet Not Found

Ensure your Solana wallet exists at `~/.config/solana/id.json`:

```bash
# Check wallet exists
ls ~/.config/solana/id.json

# If missing, create one
docker compose run --rm anchor solana-keygen new
```

## Next Steps

To fully fix the metadata issue:

1. **Use the diagnostics** to understand the exact serialization mismatch:
   ```bash
   make metaplex-diagnose
   ```

2. **Review the findings** in the output to identify the specific issue:
   - Discriminator bytes
   - Account list order
   - Data serialization format

3. **Update the Rust program** (`programs/amafcoin/src/lib.rs`):
   - Consider using `mpl-token-metadata` crate
   - Fix the manual instruction construction
   - Match Metaplex's expected format

4. **Redeploy the program** when you have devnet SOL:
   ```bash
   make deploy
   ```

5. **Initialize metadata** with the fixed instruction:
   ```bash
   # Use the program's initialize_metadata instruction
   # (will work after fix)
   ```

## Technical Reference

### Metaplex Token Metadata Program

- **Program ID**: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- **Instruction**: `CreateMetadataAccountV3`
- **Discriminator**: `[33, 15, 223, 89, 229, 234, 172, 153]`

### Current Program Implementation Issues

The program uses:
```rust
// Instruction discriminator for CreateMetadataAccountV3
let discriminator: [u8; 8] = [33, 15, 223, 89, 229, 234, 172, 153];

// Manual Borsh serialization (may have format issues)
let data = CreateMetadataAccountV3Data { ... };
instruction_data.extend(data.try_to_vec()?);
```

Potential issues:
1. **Data struct mismatch**: `CreateMetadataAccountV3Data` fields may not match Metaplex spec
2. **Option serialization**: Rust `Option<T>` Borsh encoding differs from Metaplex expectations
3. **String encoding**: UTF-8 string length prefixes

### Recommended Fix

Use the official Metaplex Rust crate:

```rust
// In Cargo.toml
[dependencies]
mpl-token-metadata = "3.3"

// In lib.rs
use mpl_token_metadata::instructions::CreateMetadataAccountV3;
use mpl_token_metadata::types::CreateMetadataAccountArgsV3;

// Create instruction using Metaplex helper
let ix = CreateMetadataAccountV3 {
    metadata: metadata_account.key(),
    mint: mint.key(),
    mint_authority: program_authority.key(),
    payer: payer.key(),
    update_authority: (program_authority.key(), true),
    system_program: system_program.key(),
    rent: Some(rent.key()),
}.instruction(CreateMetadataAccountArgsV3 {
    data: DataV2 {
        name: name,
        symbol: symbol,
        uri: uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    },
    is_mutable: true,
    collection_details: None,
});
```

This ensures 100% compatibility with Metaplex standards.
