# amaf.fun

A Kalshi-like prediction market web application built on Solana blockchain, allowing users to create prediction contracts and place bets using AMAF tokens. This is a fun betting platform with no real money involved.

## Features

- **User-Created Prediction Markets**: Create yes/no prediction contracts with questions and expiration dates
- **Betting System**: Place bets on "Yes" or "No" outcomes with dynamic pricing
- **Daily Token Faucet**: Claim 100 AMAF tokens every 24 hours for testing
- **Wallet Integration**: Connect Phantom wallet for seamless Solana interaction
- **Real-Time Market Data**: View market prices, volume, and betting history
- **Dark Mode UI**: Modern, dark-themed interface inspired by Kalshi

## Tech Stack

### Frontend

- **SvelteKit 2** - Full-stack web framework with TypeScript
- **Svelte 5** - UI framework with runes for reactivity
- **Solana Web3.js** - Solana blockchain integration
- **Solana Wallet Adapter** - Phantom wallet support

### Backend

- **Anchor Framework** - Solana smart contracts framework
- **Rust** - Smart contract programming language

### Deployment

- **Cloudflare Pages** - Static site hosting
- **Docker** - Anchor development environment (required for GLIBC compatibility)

## Prerequisites

### Required Software

1. **Node.js 18+** and npm/yarn
2. **Docker** and Docker Compose (for Anchor development)
3. **Git**

### Docker Setup (One-Time)

Docker is required for Anchor commands due to GLIBC compatibility:

```bash
# Install Docker and Docker Compose
sudo apt-get install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
```

### Solana Wallet

Install [Phantom Wallet](https://phantom.app/) for browser wallet integration.

## Installation

```bash
# Clone the repository
git clone https://github.com/Ian-Bright9/amaf.fun.git
cd amaf.fun

# Install frontend dependencies
npm install
```

## Development

### Frontend Development

```bash
# Start SvelteKit development server
npm run dev

# Open in browser
npm run dev -- --open
```

### Solana Smart Contract Development

**All Anchor commands must use Docker:**

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
docker compose run --rm anchor anchor deploy
```

### Local Solana Development

```bash
# Start local validator
solana-test-validator

# Configure network
solana config set --url localhost

# Check configuration
solana config get
```

## Build & Deploy

### Frontend

```bash
# Build for production (Cloudflare Pages)
npm run build

# Preview production build
npm run preview
```

### Deployment to Cloudflare Pages

1. Push code to GitHub repository
2. Connect repository to Cloudflare Pages
3. Configure build command: `npm run build`
4. Set output directory: `.svelte-kit/output`
5. Deploy automatically on push to main branch

## Testing

### Frontend Tests (Vitest)

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Solana Tests

```bash
# Run all tests via Docker
make test

# Skip local validator
anchor test --skip-local-validator

# Run specific test
anchor test --skip-local-validator --skip-build --test create_contract
```

## Project Structure

```
├── programs/
│   └── amafcoin/                 # Solana smart contract
│       ├── src/
│       │   └── lib.rs           # Main program logic
│       └── Cargo.toml
├── src/
│   ├── lib/
│   │   ├── components/          # Svelte components
│   │   ├── stores/              # Svelte stores (wallet, markets)
│   │   ├── api/                 # API client functions
│   │   └── utils/               # Helper functions
│   ├── routes/                  # SvelteKit file-based routing
│   │   ├── (market)/           # Market routes
│   │   ├── api/                # API routes
│   │   └── wallet/             # Wallet routes
│   ├── tests/                   # Test setup
│   └── types/                   # TypeScript definitions
├── tests/                       # Anchor tests
├── static/                      # Static assets
├── Anchor.toml                  # Anchor configuration
├── docker-compose.yml           # Docker configuration for Anchor
├── Makefile                    # Build commands
├── svelte.config.js            # SvelteKit configuration
├── vitest.config.ts            # Vitest configuration
└── package.json                # Frontend dependencies
```

## Key Commands

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run svelte-check + lint
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Check code formatting
npm run format:fix   # Format code with Prettier
npm test             # Run Vitest tests
npm run test:ui      # Run Vitest with UI
npm run test:coverage # Run tests with coverage
```

### Solana (via Docker)

```bash
make build           # Build Solana program
make test            # Run tests
make deploy          # Deploy to network
make verify          # Verify on explorer
make shell           # Open Anchor shell
make clean           # Clean build artifacts
```

## Code Style

- **TypeScript**: Strict mode with ESLint v9 and Prettier
- **Svelte 5**: Uses runes (`$state`, `$derived`, `$effect`) for reactivity
- **Rust**: Anchor framework with 2021 edition
- **Max line length**: 100 characters
- **Imports**: Use absolute imports with `$lib/` alias

## Smart Contract Instructions

### Prediction Market Functions

- `create_contract`: Create a new prediction market with question and expiration
- `place_bet`: Place a bet on Yes or No with specified amount
- `resolve_contract`: Resolve contract with outcome (after expiration)
- `initialize_token_mint`: Initialize the token mint authority
- `claim_daily_tokens`: Claim 100 AMAF tokens every 24 hours

### Contract Types

- `PredictionContract`: Stores market data and betting statistics
- `Bet`: Stores individual bet information
- `TokenState`: Tracks token minting state and claims

## Solana Program ID

**Program ID**: `FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE`

## Environment Variables

Configure in Cloudflare Pages dashboard:

```bash
# Solana RPC endpoints
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_WSS_URL=wss://api.devnet.solana.com

# Program ID
VITE_PROGRAM_ID=FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test` and `make test`
5. Run linting: `npm run check` and `npm run lint`
6. Commit your changes
7. Push to branch and create a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Inspired by [Kalshi](https://kalshi.com/) prediction markets
- Built with [SvelteKit](https://kit.svelte.dev/)
- Powered by [Solana](https://solana.com/) blockchain
