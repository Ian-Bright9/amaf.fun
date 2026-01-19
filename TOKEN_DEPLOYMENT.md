# AMAF Token Deployment Guide

## Overview

This guide covers the deployment of the AMAF token mint and associated smart contracts for the prediction market platform.

## Prerequisites

- Docker installed and configured
- Anchor CLI available via Docker
- Solana CLI configured for mainnet
- Phantom wallet extension installed

## Token Specifications

- **Symbol**: AMAF
- **Decimals**: 9 (same as SOL)
- **Supply**: Unlimited (valueless tokens)
- **Daily Distribution**: 100 tokens per wallet every 24 hours
- **Purpose**: Demo betting on prediction markets

## Smart Contract Functions

### 1. `initialize_token_mint`

Initializes the AMAF token mint and token state account.

**Requirements:**

- Authority keypair (controls token minting)
- System program for account creation
- Token program for mint initialization
- Rent sysvar for rent exemption

**Parameters:**

- None (uses authority as signer)

### 2. `claim_daily_tokens`

Allows users to claim 100 AMAF tokens every 24 hours.

**Requirements:**

- Token mint account
- Token state account (tracks last claim time)
- User's associated token account
- User's wallet (signer)
- System program
- Token program
- Rent sysvar

**Parameters:**

- None (uses wallet as signer)

**Features:**

- 24-hour cooldown between claims
- Automatically mints 100 tokens to user
- Updates token state with last claim time

### 3. Existing Functions (Enhanced)

- `create_contract` - Create prediction markets
- `place_bet` - Place bets using AMAF tokens
- `resolve_contract` - Resolve markets with outcomes

## Deployment Steps

### 1. Build the Program

```bash
make build
```

### 2. Deploy to Mainnet

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Deploy using Anchor
make deploy

# Note the program ID from deployment output
# Update Anchor.toml with the new program ID
```

### 3. Initialize Token Mint

```bash
# This requires a dedicated script or manual transaction
# The token mint needs to be initialized by the authority

# Create authority keypair (DO THIS ONCE AND SECURELY)
solana-keygen new -o token-authority.json

# Initialize token mint (requires Anchor program interaction)
# This will be automated once the program is deployed
```

### 4. Note Token Mint Address

After deployment, you'll receive:

- Program ID: Your deployed program address
- Token Mint Address: Will be generated during initialization

**IMPORTANT**: Update these addresses in your frontend code:

```typescript
// src/lib/utils/tokens.ts
export const AMAF_TOKEN_MINT = new PublicKey('YOUR_TOKEN_MINT_ADDRESS');

// src/lib/api/amaf-token.ts
const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID');
```

## Security Considerations

### Authority Key Security

The token mint authority controls:

- Creating new tokens
- Setting token authority
- Freezing token accounts
- Setting token decimals

**CRITICAL**: Keep the authority keypair secure and backed up.

### User Security

- Users only receive tokens, they cannot create unlimited tokens
- 24-hour cooldown prevents spam claiming
- On-chain verification of claim eligibility
- No admin backdoors - all claims are on-chain

## Integration with Frontend

### 1. Update Token Mint Address

```typescript
// src/lib/utils/tokens.ts
export const AMAF_TOKEN_MINT = new PublicKey('DEPLOYED_MINT_ADDRESS');
```

### 2. Update Program ID

```typescript
// src/lib/api/amaf-token.ts
const PROGRAM_ID = new PublicKey('DEPLOYED_PROGRAM_ID');
```

### 3. Test Token Claims

1. Deploy smart contracts to mainnet
2. Update frontend addresses
3. Connect Phantom wallet
4. Navigate to /wallet page
5. Click "Claim 100 AMAF"
6. Verify balance increases by 100 tokens

## Troubleshooting

### Build Fails

```bash
# Clean build artifacts
make clean

# Ensure Docker is running
docker ps

# Check Anchor logs
docker logs anchor
```

### Deployment Fails

```bash
# Check wallet balance
solana balance

# Ensure mainnet is configured
solana config get

# Check network status
solana cluster-date
```

### Token Claim Fails

1. Verify token mint is deployed
2. Check wallet has SOL for transaction fees
3. Ensure 24-hour cooldown has passed
4. Check browser console for detailed errors

## Next Steps After Deployment

1. **Update Frontend**: Replace placeholder addresses with deployed addresses
2. **Test Flows**: Verify token claiming works correctly
3. **Monitor**: Track token distribution and contract usage
4. **Documentation**: Update AGENTS.md with deployed contract addresses
5. **Testing**: Write tests for token claiming functionality

## Important Notes

- **Valueless Tokens**: AMAF tokens have no real monetary value
- **Demo Purpose**: Used for testing prediction market functionality
- **Unlimited Supply**: Can be minted indefinitely by authority
- **User Limits**: 100 tokens per wallet per 24 hours
- **No Investment**: Users don't need to buy tokens to participate
- **Real Security**: All operations use real Solana mainnet

## Contact

For issues with deployment or smart contract questions, refer to:

- Anchor documentation: https://www.anchor-lang.com/
- Solana documentation: https://docs.solana.com/
- Project AGENTS.md for development guidelines
