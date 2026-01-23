# AGENTS.md

This document provides guidelines for agentic coding assistants working on this codebase.

## Build/Test Commands

```bash
# Development
npm run dev                    # Start dev server on port 3000
npm run build                  # Build for production
npm run preview                # Preview production build

# Testing
npm run test                   # Run all tests with vitest
npx vitest run <test-file>     # Run specific test file
npx vitest run <test-file> -t <test-name>  # Run specific test by name
npx vitest watch                # Watch mode for development
```

## Project Structure

This is a React 19 + TypeScript + TanStack Start application for a Solana-based prediction market.

```
src/
├── components/      # Reusable React components
├── data/           # Server functions and data utilities
├── lib/            # Library code (Solana/Rust bindings)
│   ├── lib.rs      # Anchor smart contract program
│   └── idl/        # Anchor Interface Definition Language
├── routes/         # File-based routes (TanStack Router)
└── router.tsx      # Router configuration

programs/
└── amafcoin/       # Anchor program directory (for building contracts)
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
import { createFileRoute } from '@tanstack/react-router'
import { getPunkSongs } from '@/data/demo.punk-songs'
import './App.css'
```

### Component Structure
- Export Route objects using `export const Route = createFileRoute('...')({...})`
- Define component functions separately after Route export
- Use functional components with hooks
- Props interfaces defined inline when simple

```tsx
export const Route = createFileRoute('/')({ component: App })

function App() {
  return <div>Hello</div>
}
```

### Routing
- Use file-based routing with `createFileRoute`
- Use loaders for data fetching: `loader: async () => await getData()`
- Access loader data: `Route.useLoaderData()`
- Server functions use `createServerFn` from `@tanstack/react-start`

```tsx
export const Route = createFileRoute('/todos')({
  component: Todos,
  loader: async () => await getTodos(),
})

function Todos() {
  const todos = Route.useLoaderData()
  return <ul>{todos.map(t => <li key={t.id}>{t.name}</li>)}</ul>
}
```

### Server Functions
- Define in `src/data/` directory
- Use `createServerFn` with method specification
- Input validation with `.inputValidator()`
- Handle errors appropriately

```tsx
export const getTodos = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await readTodos()
})
```

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

### Naming Conventions
- Components: PascalCase (`Header`, `TodoList`)
- Functions/variables: camelCase (`getTodos`, `userName`)
- Route exports: `export const Route = ...`
- Server functions: descriptive names (`getPunkSongs`, `addTodo`)
- Type definitions: PascalCase for interfaces/types

### Error Handling
- Use async/await with try/catch where appropriate
- Server functions should validate inputs
- Use type assertions for API responses: `as Promise<Type>`
- Provide fallback values for optional data

### Special Files
- `src/routes/__root.tsx`: Root layout with `<Outlet />` for nested routes
- `src/router.tsx`: Router configuration (read-only routeTree.gen.ts)
- `routeTree.gen.ts`: Auto-generated (do not edit)
- CSS files: Component-specific CSS alongside component files

### Testing
- Use Vitest with React Testing Library
- Test files: `*.test.ts` or `*.test.tsx`
- No lint/typecheck commands currently configured in package.json

## Solana & Anchor Development

### Smart Contracts
- Anchor smart contracts in `src/lib/lib.rs`
- Program ID: `FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE`
- Features: Create/resolve markets, place bets, claim payouts, daily AMAF claims
- IDL generated to `src/lib/idl/amafcoin.json`

### Wallet Integration
- Use Phantom wallet for Solana wallet connection
- Install: `@solana/web3.js`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-wallets`
- Wrap app in WalletProvider for wallet context
- Use `useWallet` hook for wallet state and connection

### Solana Client Usage
```tsx
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'

function Component() {
  const { publicKey, signTransaction, connected } = useWallet()
  const connection = new Connection('https://api.devnet.solana.com')
  // ... interaction logic
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
