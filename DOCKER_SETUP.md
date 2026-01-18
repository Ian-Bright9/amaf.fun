# Anchor + Docker Setup

This project uses Docker to run Anchor commands, avoiding GLIBC compatibility issues.

## Prerequisites

Install Docker on Ubuntu:
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

After adding user to docker group, log out and back in.

## Quick Start

1. Start the Anchor container:
```bash
docker compose up -d
```

2. Run Anchor commands:
```bash
# Build the program
make build

# Run tests
make test

# Deploy to devnet
make deploy

# Open shell in container
make shell
```

## Available Commands

- `make build` - Build Solana program
- `make test` - Run tests
- `make deploy` - Deploy to configured network
- `make verify` - Verify program on explorer
- `make shell` - Open bash shell in Anchor container
- `make clean` - Clean build artifacts

## Manual Docker Commands

Or use docker-compose directly:
```bash
docker compose run --rm anchor anchor build
docker compose run --rm anchor anchor test
```

## Solana Configuration

The Anchor container uses default Solana config. Configure your network:
```bash
# Set to devnet
docker compose run --rm anchor solana config set --url devnet

# Set to localnet
docker compose run --rm anchor solana config set --url localhost
```

## Program Development

The main program is in `programs/amafcoin/`.

To build the program:
```bash
make build
```

The compiled program will be in `target/deploy/amafcoin.so`.
