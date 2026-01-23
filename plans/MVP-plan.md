# AMAF Prediction Market - Implementation Plan

**Version:** 1.0  
**Date:** 2025-01-21  
**Scope:** MVP - Wallet Connection + Create Market + Claim Daily Tokens + Market List

---

## Overview

Build a minimal Solana prediction market web application for the AMAF.COIN protocol on devnet.

### MVP Features
- Connect wallet (Phantom)
- Create prediction markets
- Claim 100 AMAF tokens daily
- View list of all markets

### Tech Stack
- **Frontend:** React 19 + TanStack Start + TanStack Query + Tailwind CSS v4
- **Solana:** Solana Web3.js + Anchor + Phantom Wallet Adapter
- **Smart Contract:** Anchor framework, deployed on devnet

---

## Architecture Decisions

### Token Minting Strategy
**Choice:** Program-Owned Mint Authority with PDA

**Why:**
- Single transaction for user claims (better UX)
- No manual key management required
- Program-controlled token supply
- Automatic token account creation via `init_if_needed`

### Escrow Strategy
**Choice:** PDA-Derived Escrow per Market

**Why:**
- Deterministic addresses from market PDA
- Program-owned security
- Single account per market
- Native to Anchor framework

---

## Phase 1: Smart Contract Modifications

### 1.1 File Structure
```
programs/
└── amafcoin/
    ├── Cargo.toml
    ├── Xargo.toml
    └── src/
        └── lib.rs
Anchor.toml
```

### 1.2 Required Changes to `programs/amafcoin/src/lib.rs`

#### A. Add Imports
```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::{self, AssociatedToken, Create, AssociatedTokenAccount};
```

#### B. Add InitializeMint Instruction
```rust
pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<()> {
    Ok(())
}
```

#### C. Add InitializeMint Context
```rust
#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = program_authority,
        mint::freeze_authority = program_authority,
        seeds = [b"mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
```

#### D. Update Market Struct
```rust
#[account]
pub struct Market {
    pub authority: Pubkey,
    pub bump: u8,  // ← ADD THIS
    pub question: String,
    pub description: String,
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub total_yes: u64,
    pub total_no: u64,
}
```

#### E. Update CreateMarket Context
```rust
#[derive(Accounts)]
#[instruction(question: String, description: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 32 + 1 + 1 + 8 + 8 + 4 + question.len() + 4 + description.len(),
        seeds = [b"market", authority.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,  // ← ADD THIS
    pub system_program: Program<'info, System>,
}
```

#### F. Update CreateMarket Function
```rust
pub fn create_market(
    ctx: Context<CreateMarket>,
    question: String,
    description: String,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    market.authority = ctx.accounts.authority.key();
    market.bump = ctx.bumps.market;  // ← ADD THIS
    market.question = question;
    market.description = description;
    market.resolved = false;
    market.outcome = None;
    market.total_yes = 0;
    market.total_no = 0;
    Ok(())
}
```

#### G. Update PlaceBet Context
```rust
#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = user,
        space = 8 + 64,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = user,
        token::mint = mint,
        token::authority = market,
        seeds = [b"escrow", market.key().as_ref()],
        bump
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,  // ← ADD THIS
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,  // ← ADD THIS
    pub system_program: Program<'info, System>,
}
```

#### H. Update PlaceBet Helper
```rust
impl<'info> PlaceBet<'info> {
    pub fn transfer_to_escrow(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_token.to_account_info(),
            to: self.escrow_token.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        
        // Sign with market PDA (owner of escrow)
        let seeds = &[
            b"market",
            self.market.authority.as_ref(),
            &[self.market.bump],
        ];
        cpi_context.with_signer(&[seeds])
    }
}
```

#### I. Update ClaimPayout Context
```rust
#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(mut, has_one = user)]
    pub bet: Account<'info, Bet>,
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = mint,
        token::authority = market,
        seeds = [b"escrow", market.key().as_ref()],
        bump
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,  // ← ADD THIS
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,  // ← ADD THIS
    pub system_program: Program<'info, System>,
}
```

#### J. Update ClaimPayout Helper
```rust
impl<'info> ClaimPayout<'info> {
    pub fn transfer_to_user(&self) -> CpiContext<'_, '_, '_', 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_token.to_account_info(),
            to: self.user_token.to_account_info(),
            authority: self.market.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        
        // Sign with market PDA (owner of escrow)
        let seeds = &[
            b"market",
            self.market.authority.as_ref(),
            &[self.market.bump],
        ];
        cpi_context.with_signer(&[seeds])
    }
}
```

#### K. Update ClaimDaily Context
```rust
#[derive(Accounts)]
pub struct ClaimDaily<'info> {
    #[account(
        mut,
        seeds = [b"mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,  // ← PDA mint
    
    #[account(
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: UncheckedAccount<'info>,  // ← PDA for mint authority
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token: Account<'info, TokenAccount>,  // ← Auto-create ATA
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 40,
        seeds = [b"claim", user.key().as_ref()],
        bump
    )]
    pub claim_state: Account<'info, DailyClaimState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,  // ← ADD THIS
    pub system_program: Program<'info, System>,
}
```

#### L. Update ClaimDaily Helper
```rust
impl<'info> ClaimDaily<'info> {
    pub fn mint_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.user_token.to_account_info(),
            authority: self.program_authority.to_account_info(),  // ← PDA authority
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        
        // Sign with program authority PDA
        let seeds = &[b"authority", &[self.bumps.program_authority]];
        cpi_context.with_signer(&[seeds])
    }
}
```

---

## Phase 2: Anchor Project Setup

### 2.1 Create Directory Structure
```bash
mkdir -p programs/amafcoin/src
mv rust/lib.rs programs/amafcoin/src/lib.rs
```

### 2.2 Create `Anchor.toml`
```toml
[toolchain]

[features]
seeds = false
skip-lint = false

[programs.devnet]
amafcoin = "FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### 2.3 Create `programs/amafcoin/Cargo.toml`
```toml
[package]
name = "amafcoin"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "amafcoin"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.30.1"
anchor-spl = { version = "0.30.1", features = ["mint", "token", "associated_token"] }
```

### 2.4 Create `programs/amafcoin/Xargo.toml`
```toml
[dependencies]
std = { features = ["backtrace", "panic_immediate_abort"], git = "https://github.com/rust-lang/wasm32-unknown-unknown" }
```

---

## Phase 3: Build and Deploy Contract

### 3.1 Install Anchor
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 3.2 Build Program
```bash
anchor build
anchor keys list
```

### 3.3 Update Program ID if Changed
```bash
# If anchor keys list shows different ID:
# Update declare_id! in lib.rs
# Update program ID in Anchor.toml
# Rebuild
anchor build
```

### 3.4 Deploy to Devnet
```bash
solana airdrop 2
anchor deploy --provider.cluster devnet
```

### 3.5 Generate IDL
```bash
anchor idl build --filepath rust/idl.json
mkdir -p src/lib/idl
cp rust/idl.json src/lib/idl/amafcoin.json
```

### 3.6 Initialize Token Mint
Create `initialize-mint.ts`:
```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "./rust/idl.json";

const main = async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = new anchor.Program(idl as any, new PublicKey("FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE"), provider);
  
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );
  
  const [authorityPda] = PublicKey.findProgramAddressSync(
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
```

Run initialization:
```bash
npm install @coral-xyz/anchor @coral-xyz/anchor-cli
npx ts-node initialize-mint.ts
```

---

## Phase 4: Frontend Dependencies

### 4.1 Install Packages
```bash
npm install \
  @solana/web3.js \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-wallets \
  @solana/wallet-adapter-react-ui \
  @coral-xyz/anchor \
  @tanstack/react-query

npm install -D @types/bn.js
```

### 4.2 Update package.json Scripts
```json
{
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "generate-idl": "cp rust/idl.json src/lib/idl/amafcoin.json"
  }
}
```

---

## Phase 5: Frontend Implementation

### 5.1 File Structure
```
src/
├── components/
│   ├── WalletButton.tsx
│   ├── CreateMarketForm.tsx
│   ├── ClaimDailyButton.tsx
│   └── MarketList.tsx
├── lib/
│   ├── idl/
│   │   └── amafcoin.json
│   ├── solana/
│   │   ├── constants.ts
│   │   ├── client.ts
│   │   └── pdas.ts
│   └── hooks/
│       └── useMarkets.ts
├── providers/
│   └── WalletProvider.tsx
└── routes/
    ├── __root.tsx
    └── index.tsx
```

### 5.2 Create Files

#### src/lib/solana/constants.ts
```typescript
export const PROGRAM_ID = "FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE"
export const DEVNET_URL = "https://api.devnet.solana.com"

export const MINT_SEED = "mint"
export const AUTHORITY_SEED = "authority"
export const MARKET_SEED = "market"
export const ESCROW_SEED = "escrow"
export const BET_SEED = "bet"
export const CLAIM_SEED = "claim"
```

#### src/lib/solana/pdas.ts
```typescript
import { PublicKey } from '@solana/web3.js'
import { PROGRAM_ID, MINT_SEED, AUTHORITY_SEED, MARKET_SEED, ESCROW_SEED, BET_SEED, CLAIM_SEED } from './constants'

export function getMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MINT_SEED)],
    new PublicKey(PROGRAM_ID)
  )
}

export function getAuthorityPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(AUTHORITY_SEED)],
    new PublicKey(PROGRAM_ID)
  )
}

export function getMarketPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MARKET_SEED), authority.toBuffer()],
    new PublicKey(PROGRAM_ID)
  )
}

export function getEscrowPDA(market: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ESCROW_SEED), market.toBuffer()],
    new PublicKey(PROGRAM_ID)
  )
}

export function getBetPDA(market: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BET_SEED), market.toBuffer(), user.toBuffer()],
    new PublicKey(PROGRAM_ID)
  )
}

export function getClaimPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CLAIM_SEED), user.toBuffer()],
    new PublicKey(PROGRAM_ID)
  )
}
```

#### src/lib/solana/client.ts
```typescript
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import idl from '../idl/amafcoin.json'
import { DEVNET_URL, PROGRAM_ID } from './constants'

export function useProgram() {
  const wallet = useWallet()
  const connection = new Connection(DEVNET_URL)
  
  const provider = new AnchorProvider(
    connection,
    wallet as any,
    { commitment: 'confirmed' }
  )
  
  return new Program(idl as any, new PublicKey(PROGRAM_ID), provider)
}
```

#### src/lib/hooks/useMarkets.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProgram } from '../solana/client'
import { useWallet } from '@solana/wallet-adapter-react'
import { getMintPDA, getMarketPDA, getClaimPDA } from '../solana/pdas'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@coral-xyz/anchor'

export function useMarkets() {
  const program = useProgram()
  
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const markets = await program.account.market.all()
      return markets.map(m => ({ publicKey: m.publicKey, ...m.account }))
    }
  })
}

export function useCreateMarket() {
  const program = useProgram()
  const wallet = useWallet()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ question, description }: { question: string, description: string }) => {
      const [marketPda] = getMarketPDA(wallet.publicKey)
      const [mintPda] = getMintPDA()
      
      return await program.methods
        .createMarket(question, description)
        .accounts({
          market: marketPda,
          authority: wallet.publicKey,
          mint: mintPda,
          systemProgram: SystemProgram.programId
        })
        .rpc()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    }
  })
}

export function useClaimDaily() {
  const program = useProgram()
  const wallet = useWallet()
  
  return useMutation({
    mutationFn: async () => {
      const [mintPda] = getMintPDA()
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        program.programId
      )
      const [claimPda] = getClaimPDA(wallet.publicKey)
      
      const [ata] = PublicKey.findProgramAddress(
        [
          wallet.publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          mintPda.toBuffer()
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
      
      return await program.methods
        .claimDailyAmaf()
        .accounts({
          mint: mintPda,
          programAuthority: authorityPda,
          userToken: ata,
          claimState: claimPda,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .rpc()
    }
  })
}
```

#### src/providers/WalletProvider.tsx
```typescript
import React from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { DEVNET_URL } from '../lib/solana/constants'
import '@solana/wallet-adapter-react-ui/styles.css'

const wallets = [new PhantomWalletAdapter()]

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={DEVNET_URL}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
```

#### src/components/WalletButton.tsx
```typescript
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

export function WalletButton() {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  
  return (
    <button
      onClick={() => wallet.connected ? wallet.disconnect() : setVisible(true)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {wallet.connected 
        ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}` 
        : 'Connect Wallet'
      }
    </button>
  )
}
```

#### src/components/CreateMarketForm.tsx
```typescript
import { useState } from 'react'
import { useCreateMarket } from '../lib/hooks/useMarkets'

export function CreateMarketForm() {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const createMarket = useCreateMarket()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMarket.mutateAsync({ question, description })
      alert('Market created!')
      setQuestion('')
      setDescription('')
    } catch (error: any) {
      alert('Failed to create market: ' + error.message)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 border rounded">
      <h2 className="text-xl font-bold">Create Market</h2>
      <input
        placeholder="Question"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        className="p-2 border rounded"
        required
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="p-2 border rounded"
        rows={3}
        required
      />
      <button 
        type="submit" 
        disabled={createMarket.isPending}
        className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {createMarket.isPending ? 'Creating...' : 'Create Market'}
      </button>
    </form>
  )
}
```

#### src/components/ClaimDailyButton.tsx
```typescript
import { useClaimDaily } from '../lib/hooks/useMarkets'

export function ClaimDailyButton() {
  const claimDaily = useClaimDaily()
  
  const handleClaim = async () => {
    try {
      await claimDaily.mutateAsync()
      alert('Claimed 100 AMAF!')
    } catch (error: any) {
      alert('Failed to claim: ' + error.message)
    }
  }
  
  return (
    <button
      onClick={handleClaim}
      disabled={claimDaily.isPending}
      className="p-4 bg-yellow-500 text-white text-xl font-bold rounded hover:bg-yellow-600 disabled:bg-gray-400"
    >
      {claimDaily.isPending ? 'Claiming...' : 'Claim 100 AMAF Daily'}
    </button>
  )
}
```

#### src/components/MarketList.tsx
```typescript
import { useMarkets } from '../lib/hooks/useMarkets'

export function MarketList() {
  const { data: markets, isLoading, error } = useMarkets()
  
  if (isLoading) return <div>Loading markets...</div>
  if (error) return <div>Error loading markets</div>
  if (!markets || markets.length === 0) return <div>No markets yet</div>
  
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">Markets</h2>
      {markets.map((market: any) => (
        <div key={market.publicKey.toString()} className="p-4 border rounded">
          <h3 className="font-bold">{market.question}</h3>
          <p className="text-sm text-gray-600">{market.description}</p>
          <p className="mt-2">
            Status: <span className={market.resolved ? 'text-green-500' : 'text-yellow-500'}>
              {market.resolved ? 'Resolved' : 'Active'}
            </span>
          </p>
          {market.resolved && (
            <p>Outcome: {market.outcome === true ? 'YES' : market.outcome === false ? 'NO' : 'Cancelled'}</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

#### src/routes/index.tsx
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { WalletButton } from '../components/WalletButton'
import { CreateMarketForm } from '../components/CreateMarketForm'
import { ClaimDailyButton } from '../components/ClaimDailyButton'
import { MarketList } from '../components/MarketList'
import { useWallet } from '@solana/wallet-adapter-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const wallet = useWallet()
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AMAF.PREDICTION</h1>
        <WalletButton />
      </header>
      
      <div className="flex flex-col gap-8">
        {wallet.connected ? (
          <>
            <div className="flex gap-4">
              <div className="flex-1">
                <CreateMarketForm />
              </div>
              <div>
                <ClaimDailyButton />
              </div>
            </div>
            <MarketList />
          </>
        ) : (
          <div className="p-8 text-center bg-gray-100 rounded">
            <p className="text-lg text-gray-600">Connect wallet to create markets and claim tokens</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### src/routes/__root.tsx
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { WalletProvider } from '../providers/WalletProvider'
import Header from '../components/Header'
import appCss from '../styles.css?url'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false }
  }
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'AMAF.PREDICTION' }
    ],
    links: [{ rel: 'stylesheet', href: appCss }]
  }),
  shellComponent: RootDocument
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <Header />
            {children}
            <TanStackDevtools position="bottom-right" />
          </WalletProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
```

#### src/components/Header.tsx
```typescript
import { Link } from '@tanstack/react-router'
import './Header.css'

export default function Header() {
  return (
    <header className="bg-blue-500 text-white p-4">
      <nav className="container mx-auto flex gap-4">
        <div className="font-bold">
          <Link to="/" className="text-white hover:text-blue-200">
            AMAF.PREDICTION
          </Link>
        </div>
      </nav>
    </header>
  )
}
```

---

## Phase 6: Testing

### 6.1 Start Development Server
```bash
npm run dev
```

### 6.2 Test Checklist

**Wallet Connection**
- [ ] Open http://localhost:3000
- [ ] Click "Connect Wallet"
- [ ] Approve in Phantom (devnet network)
- [ ] Verify wallet address shows truncated

**Claim Daily Tokens**
- [ ] Click "Claim 100 AMAF Daily"
- [ ] Approve transaction
- [ ] Verify alert "Claimed 100 AMAF!"
- [ ] Check Phantom wallet for 100 AMAF tokens

**Create Market**
- [ ] Fill question and description
- [ ] Click "Create Market"
- [ ] Approve transaction
- [ ] Verify market appears in list

**Market List**
- [ ] Verify all markets display
- [ ] Check question and description show
- [ ] Verify status (Active/Resolved)
- [ ] Check outcome for resolved markets

### 6.3 Verify on Blockchain
- Copy transaction signatures from console
- View on https://solscan.io (set to devnet)
- Verify market account creation
- Verify token mint transactions

---

## Phase 7: Troubleshooting

### Common Issues

**"Account not found"**
- Ensure initialize_mint was run
- Check mint PDA address matches contract
- Verify program deployment was successful

**"Invalid mint authority"**
- Verify program_authority PDA is correct
- Check bump seeds match
- Re-initialize mint if needed

**"Not enough SOL"**
- Airdrop devnet SOL: `solana airdrop 2`
- Ensure wallet is on devnet

**"Program account not found"**
- Verify program deployed successfully
- Check `anchor keys list` matches program ID in lib.rs
- Re-deploy if needed

**TypeScript errors in frontend**
- Verify all dependencies installed
- Check TypeScript paths in tsconfig.json
- Restart dev server

---

## Pre-Deployment Checklist

### Smart Contract
- [ ] All contract modifications implemented
- [ ] Initialize mint script executed successfully
- [ ] IDL generated and copied to frontend
- [ ] Program deployed to devnet

### Frontend
- [ ] All dependencies installed
- [ ] All components created
- [ ] Wallet provider configured
- [ ] TanStack Query client set up

### Testing
- [ ] Wallet connection works
- [ ] Claim daily tokens works
- [ ] Create market works
- [ ] Market list displays correctly
- [ ] No TypeScript errors
- [ ] All features tested on devnet

---

## PDA Reference

| Seed | Description | Purpose |
|------|-------------|---------|
| `mint` | Token mint | Program-owned AMAF token mint |
| `authority` | Mint authority | PDA for mint authority signing |
| `market` | Market account | Per-authority market data |
| `escrow` | Escrow token account | Per-market token escrow |
| `bet` | Bet account | Per-market-per-user bets |
| `claim` | Claim state | Per-user daily claim tracking |

---

## Next Steps After MVP

1. Add betting functionality
2. Add market resolution by authority
3. Add claim payouts
4. Add user bet history
5. Add market search/filter
6. Improve UI/UX
7. Add transaction history
8. Deploy to mainnet

---

**End of Implementation Plan**
