#!/bin/bash

# Deployment script for AMAF token mint
echo "Starting AMAF token deployment..."

# Build the program
echo "Building Anchor program..."
make build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build successful!"
echo "Next steps:"
echo "1. Deploy to network: make deploy"
echo "2. Note the token mint address from deployment output"
echo "3. Update AMAF_TOKEN_MINT in src/lib/utils/tokens.ts"
echo "4. Update the token mint authority keypair for mints"
echo ""
echo "Important: Keep the token mint authority keypair secure!"
echo "This keypair controls token minting for the entire platform."
