# AGENTS.md

Guidelines for agentic coding assistants working on this repository.

## Project Overview

Kalshi-like prediction market web app using Solana tokens for fun betting.

- **Frontend**: SvelteKit 5 with TypeScript, dark mode UI
- **Backend**: Solana smart contracts using Anchor Framework
- **Hosting**: Cloudflare Pages at amaf.holydoor.dev
- **Features**: User-created contracts, yes/no resolution, betting, market pricing

## Commands

### Frontend

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run check            # svelte-check + lint
npm run lint             # ESLint
npm run lint:fix         # Fix ESLint issues
npm run format:fix       # Format with Prettier
npm test                 # Run Vitest tests
npm test <test-file>     # Run specific test file
npm test -- --watch      # Watch mode
npm run test:coverage    # Coverage report
```

### Solana (Anchor via Docker - REQUIRED)

**All Anchor commands must use Docker due to GLIBC compatibility:**

```bash
make build               # Build Solana program
make test                # Run Anchor tests
make deploy              # Deploy to configured network
make verify              # Verify on explorer
make shell               # Open bash shell in Anchor container
make clean               # Clean build artifacts
```

**Docker setup (one-time):** `sudo apt-get install -y docker.io docker-compose && sudo usermod -aG docker $USER` (then log out/in)

**Run specific Anchor test:** `docker compose run --rm anchor anchor test --skip-local-validator --skip-build --test <test_name>`

## Code Style

### TypeScript / SvelteKit

- Use strict mode, Svelte stores, prefer `$derived` runes over derived stores
- Use Server Load Functions (`+page.server.ts`) for data fetching
- Use API routes (`+server.ts`) for backend logic
- Define data shapes with interfaces/types, absolute imports: `$lib/...`
- Use `.js` extension for imports (ESM requirement)

### Imports

```typescript
// Group and sort: external -> internal -> types
import { writable } from 'svelte/store';
import { createContract } from '$lib/api/contracts.js';
import { formatCurrency } from '$lib/utils/format.js';
import type { Contract } from '$lib/types/index.js';
```

### Naming Conventions

- TypeScript: camelCase (vars/functions), PascalCase (components/types)
- Svelte: PascalCase for components (.svelte files)
- Rust: snake_case (vars/functions), PascalCase (structs/enums)
- Constants: UPPER_SNAKE_CASE
- Files: PascalCase for components, lowercase for utilities

### Error Handling

```typescript
try {
	const contract = await createContract(params);
	marketsStore.addMarket({ contract, yesPrice: 0.5, noPrice: 0.5, volume: 0, bets: [] });
} catch (error) {
	if (error instanceof Error) {
		marketsStore.setError(error.message);
	} else {
		marketsStore.setError('Unknown error');
	}
}
```

### Formatting (Prettier)

- useTabs: true, singleQuote: true, semi: true, trailingComma: none
- printWidth: 100, arrowParens: always, tabWidth: 2
- Uses tabs for all files (.ts, .svelte) with visual width of 2 spaces

### ESLint Rules

- no-console: warn, no-debugger: warn, no-duplicate-imports: error
- @typescript-eslint/no-unused-vars: warn (allow `_` prefix)
- @typescript-eslint/no-explicit-any: warn
- Prettier integration enforced

## Solana Specifics

- Program ID defined in Anchor.toml
- Anchor IDL auto-generated in target/idl/
- Use @solana/wallet-adapter-react, wrap in Svelte stores
- Support Phantom wallet, handle connect/disconnect gracefully
- Local dev: `solana-test-validator`, `solana config set`

## Cloudflare Deployment

- Adapter: @sveltejs/adapter-cloudflare
- Build output: .svelte-kit/
- Prefer Static Site Generation
- Deploy via Git integration or `wrangler pages deploy`

## Project Structure

```
├── programs/amafcoin/    # Anchor program
├── src/
│   ├── routes/           # SvelteKit file-based routing
│   │   ├── (market)/     # Market routes group
│   │   ├── (user)/       # User routes group
│   │   └── api/          # API routes
│   ├── lib/
│   │   ├── components/   # Svelte components
│   │   ├── stores/       # Svelte stores (wallet, markets)
│   │   ├── api/          # API client functions
│   │   └── utils/        # Helpers
│   └── tests/            # Vitest setup
├── static/               # Static assets
└── tests/                # Test files
```

## Agent Guidelines

1. Run `npm run check`, `npm run lint`, `npm test` after changes
2. Test thoroughly before deploying smart contracts, follow Solana best practices
3. Use `$lib/` alias for imports, `$app/stores` for SvelteKit built-ins
4. Prefer server-side rendering for performance
5. Use Svelte 5 runes (`$state`, `$derived`, `$effect`) over legacy APIs
6. **Anchor commands must use Docker** - use `make build` not `anchor build`
7. Run `make shell` for interactive Anchor development
8. Program ID: `FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE`
