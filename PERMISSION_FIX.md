# Permission Fix Instructions

## Problem

The `.svelte-kit` and `node_modules/.vite-temp` directories are owned by `root`, preventing `npm run check` from running.

## Solution

You need to fix the ownership of these directories. Run these commands:

```bash
# Fix .svelte-kit directory
sudo chown -R popebenny:popebenny /home/popebenny/amaf.fun/.svelte-kit

# Fix node_modules/.vite-temp directory
sudo chown -R popebenny:popebenny /home/popebenny/amaf.fun/node_modules/.vite-temp

# Optionally fix entire node_modules if needed
sudo chown -R popebenny:popebenny /home/popebenny/amaf.fun/node_modules
```

## Verify Fix

After running the chown commands, verify:

```bash
ls -la /home/popebenny/amaf.fun/.svelte-kit/
ls -la /home/popebenny/amaf.fun/node_modules/.vite-temp/
```

Both should show `popebenny popebenny` as owner/group.

## Run Check Again

After fixing permissions, run:

```bash
npm run check
```

## Alternative: Delete and Regenerate

If chown doesn't work, you can delete the problematic directories and regenerate them:

```bash
sudo rm -rf /home/popebenny/amaf.fun/.svelte-kit
sudo rm -rf /home/popebenny/amaf.fun/node_modules/.vite-temp

# SvelteKit will regenerate these automatically when you run:
npm run dev
# or
npm run check
```

## Root Cause

This typically happens when running `npm` commands with `sudo` previously. Always avoid running npm with sudo - it creates files owned by root that normal user can't modify.
