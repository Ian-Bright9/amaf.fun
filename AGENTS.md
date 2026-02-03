# AGENTS.md

This document provides guidelines for agentic coding assistants working on this codebase.

## Build/Test Commands

```bash
# Development
npm run dev                    # Start dev server on port 3001

# Building
npm run build                  # Build for production
npm run preview                # Preview production build

# Testing
npm run test                   # Run all tests with vitest
npx vitest run <test-file>     # Run specific test file
npx vitest run <test-file> -t <test-name>  # Run specific test by name
npx vitest watch                # Watch mode for development

# Solana/Smart Contract (via Docker Compose)
docker compose run --rm anchor anchor build                   # Build Anchor program
docker compose run --rm anchor anchor deploy                  # Deploy program to devnet
docker compose run --rm anchor anchor test                    # Run Anchor tests
docker compose run --rm anchor bash                           # Interactive shell in container
docker compose run --rm anchor solana balance                 # Check wallet balance
docker compose run --rm anchor solana airdrop 1               # Request 1 SOL airdrop
docker compose run --rm anchor solana config get              # View Solana config
```

### Docker Compose Usage

All Anchor and Solana CLI commands must be run via Docker Compose using the official `solanafoundation/anchor:v0.32.0` image. The container automatically mounts:
- `~/.config/solana` for wallet keypairs and config
- `~/.config/anchor` for Anchor deployment state
- `./target` for Rust build artifacts
- Current project directory as `/workspace`

**Examples:**
```bash
# Build with verbose output
docker compose run --rm anchor anchor build --verifiable

# Deploy using specific wallet
docker compose run --rm anchor anchor deploy --provider.wallet /root/.config/solana/custom-wallet.json

# Run specific test
docker compose run --rm anchor anchor test --skip-local-validator

# Check all available wallets
docker compose run --rm anchor ls -la /root/.config/solana/
```

## Code Style Guidelines

### Imports
Order: external deps → local `@/` imports → relative imports → CSS (last). Use double quotes.

```tsx
import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { getProgram, getMarketPDA } from '@/data/markets'
import './Component.css'
```

### Component Structure
Export Route with `createFileRoute`, then define component separately. Functional components with hooks.

```tsx
export const Route = createFileRoute('/markets/create')({ component: CreateMarketPage })

function CreateMarketPage() {
  const { publicKey, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  return <div>...</div>
}
```

### Routing
File-based with `createFileRoute`. Use loaders: `loader: async () => await getData()`. Access via `Route.useLoaderData()`. Use `useRouter()`/`useNavigate()` for navigation, `<Link>` for internal links.

### Solana Integration
- `@solana/web3.js` for interactions, `@solana/wallet-adapter-react` for wallet
- `@coral-xyz/anchor` for smart contracts, `@solana/spl-token` for tokens
- Import utilities from `@/data/tokens` for PDA/ATA calculations
- Program ID: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn` (devnet)
- Load program via `getProgram()` from `@/data/markets`, use PDAs for all program accounts

### TypeScript
Strict mode enabled. Path alias `@/*` maps to `./src/*`. No unused locals/parameters allowed.

### Styling
Tailwind CSS v4 primary. Component-specific CSS files: `import './Component.css'`. Use utility classes: `className="flex flex-col gap-2"`. PascalCase for CSS class names.

### Naming
- Components: PascalCase (`Header`, `DailyAmafClaim`)
- Functions/variables: camelCase (`getMintPDA`, `userName`)
- PDA functions: `get<Mint|Authority|ClaimState>PDA()`
- Route exports: `export const Route = ...`

### Error Handling
Async/await with try/catch. Use `console.error` for logging. Set error state: `const [error, setError] = useState('')`. Validate inputs before transactions. Use loading states: `setLoading(true)` before async, `setLoading(false)` in finally.

### State Management
React hooks: `useState`, `useEffect`, `useCallback`. Wallet: `useWallet()`. Router: `useRouter()`, `useNavigate()`.

## Common Patterns

#### Wallet Check
```tsx
const { publicKey, connected, signTransaction } = useWallet()
if (!connected) return <p>Please connect your wallet</p>
```

#### Transaction Flow
```tsx
setLoading(true)
try {
  const [mintPda] = getMintPDA()
  const { address: userToken, instruction: createAtaIx } = 
    await getOrCreateUserTokenAccount(publicKey, mintPda, connection, publicKey)
  const transaction = new Transaction()
  if (createAtaIx) transaction.add(createAtaIx)
  transaction.add(program.instruction.method(...).accounts({...}))
  await connection.sendRawTransaction(transaction.serialize())
  setError('')
} catch (err) {
  console.error('Error:', err)
  setError('Transaction failed')
} finally {
  setLoading(false)
}
```

## Project Structure
React 19 + TypeScript + TanStack Start for Solana prediction market.

```
src/
├── components/      # React components with CSS files
├── data/           # Server functions, token/markets utilities
├── lib/            # Anchor program IDL (amafcoin.json)
├── routes/         # File-based routes with loaders
├── styles.css      # Global styles
└── router.tsx      # Router config (read-only)

programs/amafcoin/src/lib.rs  # Anchor smart contract
```

## Special Files
- `__root.tsx`: Root layout with `<Outlet />`, wrap with WalletProvider
- `router.tsx`: Read-only, don't modify `routeTree.gen.ts`
- Test files: `*.test.ts` or `*.test.tsx` in `src/`

## Tech Stack
React 19, TypeScript 5.7, TanStack Router/Start, Vite, Tailwind CSS v4, Vitest, Solana Web3.js, Anchor 0.32.0

## Known Issues
Mint initialization: Anchor 0.31.1 library/IDL compatibility issues. Manual instruction fails with `InstructionFallbackNotFound`, Program API fails with encode error. Mint PDA: `6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG`
