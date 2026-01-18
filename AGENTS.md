# AGENTS.md

This file contains guidelines for agentic coding assistants working on this repository.

## Project Overview

This is a Kalshi-like prediction market web app using Solana tokens for fun betting (no real money).
- **Frontend**: Next.js with TypeScript, dark mode UI similar to Kalshi
- **Backend**: Solana smart contracts using Anchor Framework
- **Hosting**: Cloudflare Pages at amaf.holydoor.dev
- **Features**: User-created contracts with yes/no resolution, betting, market pricing

## Build Commands

### Frontend (Next.js)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Solana (Anchor)
```bash
anchor build         # Build Solana program
anchor test          # Run tests against local validator
anchor deploy        # Deploy to configured network
anchor verify        # Verify program on explorer
```

## Testing

### Run All Tests
```bash
# Frontend
npm test

# Solana
anchor test --skip-local-validator
```

### Run Single Test
```bash
# Frontend - specific test file
npm test src/features/contracts/__tests__/createContract.test.ts

# Solana - specific test
anchor test --skip-local-validator --skip-build --test create_contract
```

## Code Style Guidelines

### TypeScript / Next.js
- Use **strict mode** in `tsconfig.json`
- Prefer **App Router** over Pages Router
- Use **Server Components** by default, Client Components only when needed
- Define data shapes with **interfaces** or **types**
- Use absolute imports: `@/components/...` instead of relative paths

### Anchor / Rust
- Use **Rust 2021 edition**
- Define account constraints with `#[account]` macros
- Use `#[program]` macro for instruction handlers
- Follow Anchor naming conventions: snake_case for variables, CamelCase for types

### Imports
```typescript
// Frontend - group and sort imports
import React from 'react'
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/Button'
import { createContract } from '@/api/contracts'
```

### Naming Conventions
- TypeScript: camelCase for variables/functions, PascalCase for components/types
- Rust: snake_case for variables/functions, PascalCase for structs/enums
- Constants: UPPER_SNAKE_CASE
- Files: PascalCase for components, lowercase for utilities

### Error Handling
```typescript
// Use try-catch with specific error types
try {
  const tx = await createContract(params)
  return { success: true, signature: tx }
} catch (error) {
  if (error instanceof AnchorError) {
    return { success: false, error: error.error.errorMessage }
  }
  return { success: false, error: 'Unknown error occurred' }
}
```

### Formatting
- Use **Prettier** with default settings
- Configure ESLint to match Prettier
- Max line length: 100 characters
- Use 2 spaces for indentation

## Solana Specifics

### Program Structure
- Program ID defined in `Anchor.toml`
- Anchor IDL auto-generated in `target/idl/`
- Key files: `programs/<program-name>/src/lib.rs`

### Wallet Integration
- Use `@solana/wallet-adapter-react` for wallet connection
- Support Phantom wallet primarily
- Handle wallet connection/disconnection gracefully

### Local Development
```bash
solana-test-validator   # Start local validator
solana config set       # Configure network (localnet/devnet/mainnet-beta)
```

## Cloudflare Deployment

- Build output: `.next/` directory
- Use **Static Site Generation** where possible
- Environment variables set in Cloudflare dashboard
- Deploy via Git integration or `wrangler pages deploy`

## Project Structure (to be created)

```
├── programs/          # Anchor programs
│   └── amafcoin/     # Main prediction market program
├── app/              # Next.js app directory
│   ├── (market)/     # Market pages
│   ├── (user)/       # User dashboard
│   └── api/          # API routes
├── components/       # Reusable components
├── lib/              # Utilities and helpers
├── hooks/            # Custom React hooks
└── types/            # TypeScript type definitions
```

## Notes for Agents

1. This is a **new project** - commands may need adjustment after scaffolding
2. Always run `npm run lint` and `npm run type-check` after changes
3. Test thoroughly before deploying smart contracts
4. Follow Solana best practices for security and gas efficiency
5. Keep UI responsive and accessible (dark mode design)
6. Ensure proper error messages for users
