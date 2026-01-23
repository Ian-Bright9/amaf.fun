# AGENTS.md

This document provides guidelines for agentic coding assistants working on this codebase.

## Build/Test Commands

```bash
# Development
npm run dev                    # Start dev server on port 3000

# Building
npm run build                  # Build for production
npm run preview                # Preview production build

# Testing
npm run test                   # Run all tests with vitest
npx vitest run <test-file>     # Run specific test file
npx vitest run <test-file> -t <test-name>  # Run specific test by name
npx vitest watch                # Watch mode for development

# Solana/Smart Contract
anchor build                   # Build Anchor program
anchor deploy                  # Deploy program to devnet
anchor test                    # Run Anchor tests
anchor test --skip-local-validator  # Run tests without local validator
```

## Project Structure

This is a React 19 + TypeScript + TanStack Start application for a Solana-based prediction market.

```
src/
├── components/      # Reusable React components
│   ├── DailyAmafClaim.tsx + DailyAmafClaim.css
│   ├── Header.tsx + Header.css
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   └── WalletConnectButton.tsx
├── data/           # Server functions and data utilities
│   ├── tokens.ts          # Token/PDA utilities
│   ├── markets.ts         # Market data & program helpers
│   └── demo.punk-songs.ts
├── lib/            # Library code (Solana/Rust bindings)
│   ├── lib.rs      # Anchor smart contract program
│   └── idl/        # Anchor Interface Definition Language
│       └── amafcoin.json  # Program IDL
├── routes/         # File-based routes (TanStack Router)
│   ├── __root.tsx           # Root layout with <Outlet />
│   ├── index.tsx             # Home page
│   ├── markets/              # Markets routes
│   │   ├── index.tsx       # Market listing page
│   │   ├── create.tsx      # Create market form
│   │   └── $id.tsx        # Market detail/betting page
│   └── markets.tsx           # Fallback
├── styles.css               # Global styles
└── router.tsx              # Router configuration (read-only)
```

```
programs/
└── amafcoin/       # Anchor program directory
    ├── src/lib.rs    # Smart contract source
    ├── Anchor.toml    # Anchor configuration
    └── target/          # Build artifacts
```

## Code Style Guidelines

### Imports
Order imports as:
1. External dependencies from node_modules
2. Local imports with `@/` alias (maps to `./src/`)
3. Relative imports
4. CSS imports (last)

Use double quotes for all imports.

```tsx
import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { getProgram, getMarketPDA } from '@/data/markets'
import { getMintPDA, getProgramAuthorityPDA } from '@/data/tokens'
import './Component.css'
```

### Component Structure
- Export Route objects using `export const Route = createFileRoute('...')({...})`
- Define component functions separately after Route export
- Use functional components with hooks
- Props interfaces defined inline when simple

```tsx
export const Route = createFileRoute('/markets/create')({ component: CreateMarketPage })

function CreateMarketPage() {
  const { publicKey, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  return <div>...</div>
}
```

### Routing
- Use file-based routing with `createFileRoute`
- Use loaders for data fetching: `loader: async () => await getData()`
- Access loader data: `Route.useLoaderData()`
- Use `useRouter()` for navigation
- Use `<Link>` for internal links

### Solana Integration
- Use `@solana/web3.js` for Solana interactions
- Use `@solana/wallet-adapter-react` for wallet connection
- Use `@coral-xyz/anchor` for smart contract interactions
- Use `@solana/spl-token` for token operations
- Import utilities from `@/data/tokens` for PDA/ATA calculations
- Program ID: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn` (devnet)

### Smart Contract Interaction
- Load program via `getProgram()` from `@/data/markets`
- Use PDAs for all program-derived accounts
- Use Associated Token Accounts (ATA) for token transfers
- Handle token account creation with `getOrCreateUserTokenAccount()` when needed

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/*` maps to `./src/*`
- Target: ES2022, Module: ESNext
- No unused locals/parameters allowed (enforced by tsconfig)

### Styling
- Primary styling with Tailwind CSS v4
- Component-specific CSS files in component directories
- Import CSS files: `import './Component.css'`
- Use Tailwind utility classes: `className="flex flex-col gap-2"`
- Use PascalCase for CSS class names in .css files

### Naming Conventions
- Components: PascalCase (`Header`, `DailyAmafClaim`)
- Functions/variables: camelCase (`getMintPDA`, `userName`, `checkLastClaim`)
- Route exports: `export const Route = ...`
- Server functions: descriptive names (`getProgram`, `createMarket`)
- PDA functions: `get<Mint|Authority|ClaimState>PDA()`
- Type definitions: PascalCase for interfaces/types

### Error Handling
- Use async/await with try/catch where appropriate
- Use console.error for logging errors: `console.error('Error:', err)`
- Set error state for UI feedback: `const [error, setError] = useState('')`
- Validate inputs before transactions
- Provide clear error messages to users
- Use loading states: `const [loading, setLoading] = useState(false)`

### State Management
- Use React hooks: `useState`, `useEffect`, `useCallback`
- Use wallet hooks: `useWallet()` for connection state
- Use router hooks: `useRouter()`, `useNavigate()`
- Set loading states before async operations: `setLoading(true)` then `setLoading(false)`

## Special Files

### src/routes/__root.tsx
- Root layout with `<Outlet />` for nested routes
- Wrap app with WalletProvider for wallet context

### src/router.tsx
- Router configuration (read-only, auto-generated)
- Do not modify `routeTree.gen.ts`

### src/lib/lib.rs
- Anchor smart contract source
- Program ID: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn`
- Features: Markets, betting, resolution, payouts, daily claims

### Anchor.toml
- `[programs.devnet]`: Program definitions
- `[provider]`: cluster and wallet configuration
- `[scripts]`: test commands for Anchor tests

### Testing
- Test files: `*.test.ts` or `*.test.tsx` in `src/` directory
- Use Vitest with React Testing Library
- Run single test: `npx vitest run <test-file> -t <test-name>`
- Run tests in watch mode during development: `npx vitest watch`

## Solana & Anchor Development

### Program Deployment
- Program is deployed to devnet
- ID: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn`
- Build: `anchor build` before deploying
- Deploy: `anchor deploy` or `anchor upgrade`

### Token Utilities
- Import from `@/data/tokens`:
  - `getMintPDA()`: Get mint PDA
  - `getProgramAuthorityPDA()`: Get program authority PDA
  - `getUserTokenAccount(user, mint)`: Get user's ATA
  - `getEscrowTokenAccount(market, mint)`: Get market escrow ATA
  - `getClaimStatePDA(user)`: Get daily claim state PDA
  - `getOrCreateUserTokenAccount(user, mint, connection, payer)`: Get or create ATA with instruction

### Common Patterns

#### Connecting Wallet
```tsx
const { publicKey, connected, signTransaction } = useWallet()
if (!connected) {
  return <p>Please connect your wallet</p>
}
```

#### Transaction Flow
```tsx
setLoading(true)
try {
  // 1. Get accounts via PDAs
  const [mintPda] = getMintPDA()
  
  // 2. Get or create token accounts
  const { address: userToken, instruction: createAtaIx } = 
    await getOrCreateUserTokenAccount(publicKey, mintPda, connection, publicKey)
  
  // 3. Build transaction
  const transaction = new Transaction()
  if (createAtaIx) transaction.add(createAtaIx)
  transaction.add(program.instruction.method(...).accounts({...}))
  
  // 4. Send transaction
  const signature = await signTransaction(transaction)
  await connection.sendRawTransaction(transaction.serialize())
  
  // 5. Show success
  setError('')
} catch (err) {
  console.error('Transaction failed:', err)
  setError('Transaction failed: ' + err.message)
} finally {
  setLoading(false)
}
```

#### Data Fetching
```tsx
// Server function (src/data/markets.ts)
export const getMarkets = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await fetchMarkets()
})

// Route with loader
export const Route = createFileRoute('/markets')({
  component: MarketsPage,
  loader: async () => await getMarkets()
})

// Access data
function MarketsPage() {
  const markets = Route.useLoaderData()
  return <ul>{markets.map(m => <li>{m.question}</li>)}</ul>
}
```

## Tech Stack
- React 19
- TypeScript 5.7
- TanStack Router (file-based routing)
- TanStack Start (SSR framework)
- Vite (build tool)
- Tailwind CSS v4
- Vitest (testing)
- Solana Web3.js
- Anchor Framework (smart contracts)
- Phantom Wallet (wallet integration)
- @coral-xyz/anchor 0.31.1

## Known Issues
- **Mint Initialization**: Anchor 0.31.1 library/IDL compatibility issues with `initializeMint`
  - Manual instruction construction fails with `InstructionFallbackNotFound`
  - Anchor Program API fails with `TypeError: Cannot read properties of undefined (reading 'encode')`
  - Mint PDA exists at: `6SZG9fnQ3PUj8C41ootubxdzhdhb8hWv9zMRE97U1GWG`
  - Solution pending: Investigate Anchor library version or IDL format requirements
