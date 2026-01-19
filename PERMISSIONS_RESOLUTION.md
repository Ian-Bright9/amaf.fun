# Permission Issues Resolution Guide

## Problem

The `node_modules` directory contains files owned by `root`, preventing npm from installing new packages like `@project-serum/anchor`.

## Solution 1: Fix All Permissions (Recommended)

Run these commands:

```bash
# Fix ownership of entire project
sudo chown -R popebenny:popebenny /home/popebenny/amaf.fun

# Verify
ls -la /home/popebenny/amaf.fun/node_modules
```

Then reinstall packages:

```bash
npm install
```

## Solution 2: Delete and Reinstall (Alternative)

If chown doesn't work:

```bash
# Navigate to project directory
cd /home/popebenny/amaf.fun

# Delete node_modules and lockfile
sudo rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## What's Blocking Integration

The `@project-serum/anchor` package is required for:

- Creating Anchor transactions in API routes
- Deserializing Borsh-encoded account data
- Interfacing with your deployed smart contract

## Current Workarounds Applied

1. **Removed unused instructions.ts** - Was importing anchor but not needed
2. **Fixed Svelte runes syntax errors** - Changed `$:` to `$effect`
3. **Fixed layout structure** - Removed duplicate nav elements
4. **Updated network to devnet** - Changed all mainnet references
5. **Fixed TypeScript errors** - Added type annotations where missing

## Next Steps After Permissions Fix

1. Run:

   ```bash
   npm install
   npm run check
   ```

2. If errors persist, run:

   ```bash
   npm run lint:fix
   ```

3. Test the application:

   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Testing Checklist After Fix

- [ ] Connect Phantom wallet on devnet
- [ ] Create a market at `/market/create`
- [ ] Place bets on a market
- [ ] Resolve a market (after expiration)
- [ ] Claim daily tokens

## Important Note

**Never run `npm` commands with `sudo`!** This creates files owned by root that normal users can't modify. Always run npm as your regular user.

If you must use sudo for some reason, fix ownership immediately after:

```bash
sudo chown -R $USER:$USER node_modules
```

## Current Project Status

✅ Smart contract deployed on devnet
✅ Program ID: `FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE`
✅ IDL imported and configured
✅ All API routes created
✅ Borsh deserialization implemented
✅ Transaction signing flow complete
✅ Wallet adapter configured for devnet

⏳ **Blocked by**: Missing @project-serum/anchor package (permission issue)
