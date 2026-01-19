# AGENTS.md

This file contains guidelines for agentic coding assistants working on this repository.

## Project Overview

This is a Kalshi-like prediction market web app using Solana tokens for fun betting (no real money).

- **Frontend**: SvelteKit with TypeScript, dark mode UI similar to Kalshi
- **Backend**: Solana smart contracts using Anchor Framework
- **Hosting**: Cloudflare Pages at amaf.holydoor.dev
- **Features**: User-created contracts with yes/no resolution, betting, market pricing

## Build Commands

### Frontend (SvelteKit)

```bash
npm run dev          # Start development server
npm run build        # Build for production (Cloudflare Pages)
npm run preview      # Preview production build
npm run check        # Run svelte-check + lint
npm run check:watch  # Run svelte-check in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Check code formatting with Prettier
npm run format:fix   # Format code with Prettier
npm test             # Run Vitest tests
npm run test:ui      # Run Vitest with UI
npm run test:coverage # Run tests with coverage
```

### Solana (Anchor via Docker)

**Due to GLIBC compatibility, use Docker for Anchor commands:**

```bash
# Build Solana program
make build

# Run tests
make test

# Deploy to configured network
make deploy

# Verify program on explorer
make verify

# Open shell in Anchor container
make shell

# Clean build artifacts
make clean
```

**Or use docker-compose directly:**

```bash
docker compose run --rm anchor anchor build
docker compose run --rm anchor anchor test
```

**Docker Setup Required (one-time):**

```bash
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
# Log out and back in
```

## Testing

### Run All Tests

```bash
# Frontend (Vitest)
npm test

# Solana
anchor test --skip-local-validator
```

### Run Single Test

```bash
# Frontend - specific test file
npm test src/lib/utils/format.test.ts

# Solana - specific test
anchor test --skip-local-validator --skip-build --test create_contract
```

### Watch Mode

```bash
npm test -- --watch
```

## Code Style Guidelines

### TypeScript / SvelteKit

- Use **strict mode** in `tsconfig.json`
- Use **Svelte stores** for state management instead of React hooks
- Use **Server Load Functions** (`+page.server.ts`) for server data
- Use **API routes** (`+server.ts`) for backend logic
- Define data shapes with **interfaces** or **types**
- Use absolute imports: `$lib/...` instead of relative paths
- Prefer **$derived** runes for computed values over derived stores when possible

### Anchor / Rust

- Use **Rust 2021 edition**
- Define account constraints with `#[account]` macros
- Use `#[program]` macro for instruction handlers
- Follow Anchor naming conventions: snake_case for variables, CamelCase for types

### Imports

```typescript
// SvelteKit - group and sort imports
import { walletStore } from '$lib/stores/wallet.js';
import { createContract } from '$lib/api/contracts.js';
import { formatCurrency } from '$lib/utils/format.js';
import type { Contract } from '$lib/types/index.js';
```

### Svelte Component Patterns

```svelte
<script lang="ts">
	import { marketsStore } from '$lib/stores/markets.js';

	// Use $derived for computed values
	const markets = $derived($marketsStore.markets);

	// Event handlers
	function handleCreate() {
		// Logic here
	}
</script>

<!-- Template syntax -->
<div class="container">
	{#each markets as market}
		<div class="card">{market.contract.question}</div>
	{/each}
</div>

<style>
	.container {
		padding: 1rem;
	}
</style>
```

### Naming Conventions

- TypeScript: camelCase for variables/functions, PascalCase for components/types
- Svelte: PascalCase for components (.svelte files)
- Rust: snake_case for variables/functions, PascalCase for structs/enums
- Constants: UPPER_SNAKE_CASE
- Files: PascalCase for components, lowercase for utilities

### Error Handling

```typescript
// Use try-catch with specific error types
try {
	const contract = await createContract(params);
	marketsStore.addMarket({
		contract,
		yesPrice: 0.5,
		noPrice: 0.5,
		volume: 0,
		bets: []
	});
} catch (error) {
	if (error instanceof Error) {
		marketsStore.setError(error.message);
	} else {
		marketsStore.setError('Unknown error occurred');
	}
}
```

### Formatting

- Use **Prettier** with default settings
- Configure ESLint to match Prettier
- Max line length: 100 characters
- Use 2 spaces for indentation (tabs in Svelte files)

### ESLint Configuration

- ESLint v9 with flat config format
- TypeScript, Svelte, and Prettier plugins enabled
- Key rules: `no-console`, `no-debugger`, `no-duplicate-imports`
- Unused variables allowed with `_` prefix pattern
- Strict TypeScript checking enabled

## Solana Specifics

### Program Structure

- Program ID defined in `Anchor.toml`
- Anchor IDL auto-generated in `target/idl/`
- Key files: `programs/<program-name>/src/lib.rs`

### Wallet Integration

- Use `@solana/wallet-adapter-react` for wallet connection
- Create Svelte stores to wrap React wallet adapter
- Support Phantom wallet primarily
- Handle wallet connection/disconnection gracefully

### Local Development

```bash
solana-test-validator   # Start local validator
solana config set       # Configure network (localnet/devnet/mainnet-beta)
```

## Cloudflare Deployment

- **Adapter**: `@sveltejs/adapter-cloudflare` configured in `svelte.config.js`
- Build output: `.svelte-kit/` directory
- Use **Static Site Generation** where possible
- Environment variables set in Cloudflare dashboard
- Deploy via Git integration or `wrangler pages deploy`

## Project Structure

```
├── programs/               # Anchor programs
│   └── amafcoin/          # Main prediction market program
├── src/
│   ├── routes/            # SvelteKit file-based routing
│   │   ├── +layout.svelte         # Root layout (dark theme)
│   │   ├── +page.svelte           # Home page
│   │   ├── +page.server.ts        # Server data loading
│   │   ├── (market)/             # Market routes group
│   │   │   ├── +layout.svelte     # Market layout
│   │   │   ├── +page.svelte       # Market list
│   │   │   ├── create/
│   │   │   │   └── +page.svelte   # Create market
│   │   │   └── [slug]/           # Individual market pages
│   │   ├── (user)/               # User routes group
│   │   │   ├── +layout.svelte     # User layout
│   │   │   └── dashboard/
│   │   └── api/                  # API routes
│   │       └── contracts/
│   │           └── +server.ts    # Contracts API
│   ├── lib/
│   │   ├── components/           # Svelte components
│   │   ├── stores/               # Svelte stores (wallet, markets)
│   │   ├── api/                  # API client functions
│   │   └── utils/                # Helpers
│   ├── tests/                    # Test utilities
│   │   └── setup.ts              # Vitest setup
│   └── types/                    # TypeScript definitions
│       └── index.ts
├── static/                       # Static assets
├── tests/                        # Test files
├── svelte.config.js             # SvelteKit configuration
├── vite.config.ts               # Vite configuration
├── vitest.config.ts              # Vitest configuration
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
└── tsconfig.json                 # TypeScript configuration
```

## SvelteKit-Specific Patterns

### Server Load Functions

```typescript
// src/routes/+page.server.ts
import { getContracts } from '$lib/api/contracts.js';

export async function load() {
	try {
		const contracts = await getContracts();
		return { contracts };
	} catch (error) {
		return { contracts: [], error: 'Failed to load contracts' };
	}
}
```

### API Routes

```typescript
// src/routes/api/contracts/+server.ts
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	return new Response(JSON.stringify({ contracts: [] }), {
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	// Process request
	return new Response(JSON.stringify({ success: true }), {
		headers: { 'Content-Type': 'application/json' },
		status: 201
	});
};
```

### Svelte Stores

```typescript
// src/lib/stores/example.ts
import { writable } from 'svelte/store';

export const exampleStore = writable({
	value: 0,
	loading: false
});
```

## Notes for Agents

1. Always run `npm run check`, `npm run lint`, and `npm test` after changes
2. Test thoroughly before deploying smart contracts
3. Follow Solana best practices for security and gas efficiency
4. Keep UI responsive and accessible (dark mode design)
5. Ensure proper error messages for users
6. Use `$lib/` alias for imports from `src/lib/`
7. Use `$app/stores` for SvelteKit built-in stores (page, navigation)
8. Prefer server-side rendering for better performance and SEO
9. Use `+page.server.ts` for data fetching when possible
10. Use Svelte 5 runes (`$state`, `$derived`, `$effect`) over legacy APIs
11. **Anchor commands must use Docker** due to GLIBC compatibility - use `make build` not `anchor build`
12. When working with Solana contracts, run `make shell` to get bash shell in Anchor container
13. Solana program ID: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLn`
14. **Docker must be installed before running Anchor commands** - run `sudo apt-get install -y docker.io docker-compose && sudo usermod -aG docker $USER` then log out and back in

## Recent Changes

**Step 1: Anchor Installation + Docker Setup** (2026-01-18)

- ✅ Installed Rust 1.92.0 and Anchor Version Manager (avm) v0.32.1
- ✅ Created Docker-based Anchor setup to bypass GLIBC compatibility
- ✅ Configured docker-compose.yml with coralxyz/anchor:latest image
- ✅ Created Makefile with build, test, deploy, verify, shell commands
- ✅ Set up simple counter program in programs/amafcoin/
- ✅ Configured Anchor.toml with program ID for all networks
- ✅ Updated AGENTS.md with Docker workflow instructions

**Step 2: SvelteKit Migration** (2026-01-18)

- ✅ Complete SvelteKit project with TypeScript
- ✅ Dark theme UI structure (Kalshi-like)
- ✅ Svelte stores for state management (wallet, markets)
- ✅ API routes and market pages (create, list, navigation)
- ✅ 13/13 tests passing (format utilities, stores)
- ✅ ESLint v9 with Prettier, TypeScript, and Svelte plugins
- ✅ Cloudflare Pages adapter configured
- ✅ Project structure ready for development

**Step 3: Git Commit** (2026-01-18)

- ✅ Committed 1,748 files (1,748 additions, 82 deletions)
- ✅ Comprehensive commit message created
- ⚠️ Requires GitHub authentication to push
- 📦 Repository: https://github.com/Ian-Bright9/amaf.fun

14. **Docker must be installed before running Anchor commands** - run `sudo apt-get install -y docker.io docker-compose && sudo usermod -aG docker $USER` then log out and back in
