# AMAF Prediction Market Implementation Plan

## Project Overview
Solana-based prediction market platform using Anchor smart contracts and React 19 + TanStack Start frontend.

---

## Phase 1: Project Setup ✅
### Status: Complete
- [x] Initialize project with TanStack Start
- [x] Install dependencies (React 19, TypeScript, Tailwind CSS v4)
- [x] Configure TypeScript with strict mode
- [x] Set up routing structure
- [x] Configure Tailwind CSS v4

---

## Phase 2: Smart Contract Development ✅
### Status: Complete
- [x] Initialize Anchor workspace
- [x] Create prediction market program structure
- [x] Implement `initializeMint` instruction
- [x] Implement `createMarket` instruction
- [x] Implement `placeBet` instruction
- [x] Implement `resolveMarket` instruction
- [x] Implement `cancelMarket` instruction
- [x] Implement `claimPayout` instruction
- [x] Implement `claimDailyAmaf` instruction
- [x] Define account structures (Market, Bet, DailyClaimState)
- [x] Add custom error codes
- [x] Implement validation logic

---

## Phase 3: Smart Contract Testing & Deployment ✅
### Status: Complete
- [x] Fix smart contract issues (removed duplicate code, fixed type issues)
- [x] Build program to target/deploy/amafcoin.so
- [x] Deploy program to devnet
- [x] Generate IDL from deployed program
- [x] Copy IDL to src/lib/idl/amafcoin.json

### Deployment Details
- **Network**: devnet
- **Program ID**: BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn
- **Deployment Signature**: 2X81U8aypdPp3viCVXxfm8XggJ9EHY2ahH7UrHHpttL5r5fzkefZxFr7Xa4D7qiG7SP597oh42gX3hm6chC4SYM

### Known Issues
- **Mint Initialization**: Anchor BorshAccountsCoder incompatibility with IDL format
  - Root cause: Library expects account types in `idl.types` but standard format uses `idl.accounts`
  - Impact: Cannot initialize mint using Anchor library directly
  - Workaround options:
    1. Use raw Solana Web3.js API
    2. Manually modify IDL to include types in both arrays
    3. Investigate Anchor version compatibility
  - **Note**: Mint can be initialized using alternative methods when needed

---

## Phase 4: Frontend Dependencies ✅
### Status: Complete
- [x] Install @solana/web3.js
- [x] Install @solana/wallet-adapter-react
- [x] Install @solana/wallet-adapter-react-ui
- [x] Install @solana/wallet-adapter-wallets
- [x] Install @solana/wallet-adapter-base
- [x] Install @solana/spl-token
- [x] Install @coral-xyz/anchor
- [x] Install @coral-xyz/anchor-cli

### Installed Versions
```
@solana/web3.js: latest
@solana/wallet-adapter-react: latest
@solana/wallet-adapter-react-ui: latest
@solana/wallet-adapter-wallets: latest
@solana/wallet-adapter-base: latest
@solana/spl-token: 0.4.14
@coral-xyz/anchor: 0.31.1
@coral-xyz/anchor-cli: 0.31.2
```

---

## Phase 5: Frontend Implementation
### Status: Complete ✅

### 5.1 Wallet Connection
- [x] Wrap app with WalletProvider
- [x] Add WalletModalProvider
- [x] Create WalletConnectButton component
- [x] Implement wallet connection UI
- [x] Add wallet disconnect functionality
- [x] Display wallet address and balance

### 5.2 Layout Components
- [x] Create Header component with wallet button
- [x] Create Footer component
- [x] Create Navigation component
- [x] Update root layout

### 5.3 Market List Page
- [x] Create /markets route
- [x] Fetch and display list of active markets
- [x] Show market question and description
- [x] Display total bets (YES/NO)
- [x] Show market status (active/resolved)
- [x] Add "Create Market" button

### 5.4 Create Market Page
- [x] Create /markets/create route
- [x] Add market question input
- [x] Add market description input
- [x] Implement form validation
- [x] Create market transaction handler
- [x] Show success/error messages

### 5.5 Market Detail Page
- [x] Create /markets/[id] route
- [x] Fetch and display market details
- [x] Show YES/NO betting pools
- [x] Add "Place Bet" functionality
- [x] Display list of bets
- [x] Show market resolution controls (for authority)
- [x] Implement Resolve Market button
- [x] Implement Cancel Market button

### 5.6 Place Bet UI
- [x] Add bet amount input
- [x] Add YES/NO toggle
- [x] Calculate potential return
- [x] Show current odds
- [x] Implement bet transaction
- [x] Update UI after successful bet

### 5.7 Claim Payout UI
- [x] Display user's winning bets
- [x] Add "Claim" buttons for unclaimed payouts
- [x] Implement claim transaction
- [x] Show claimed history

### 5.8 Daily AMAF Claim
- [x] Add "Claim Daily AMAF" button
- [x] Check if 24 hours have passed
- [x] Show next claim countdown
- [x] Implement claim transaction
- [x] Display current AMAF balance

### 5.9 Error Handling & Loading States
- [x] Add loading spinners
- [x] Show error messages with context
- [x] Implement retry functionality
- [x] Add transaction status notifications

### 5.10 Responsive Design
- [x] Mobile-friendly wallet button
- [x] Responsive market cards
- [x] Touch-friendly betting controls
- [x] Optimize for various screen sizes

---

## Phase 6: Testing
### Status: Pending
- [ ] Write unit tests for components
- [ ] Write integration tests for wallet operations
- [ ] Test market creation flow
- [ ] Test betting flow
- [ ] Test payout claiming
- [ ] Test daily AMAF claiming
- [ ] Manual testing on devnet
- [ ] Security audit

---

## Phase 7: Deployment
### Status: Pending
- [ ] Build production bundle
- [ ] Deploy to hosting platform
- [ ] Configure domain
- [ ] Set up SSL certificates
- [ ] Deploy program to mainnet
- [ ] Test on mainnet with small amounts

---

## Phase 8: Post-Launch
### Status: Pending
- [ ] Monitor for issues
- [ ] Gather user feedback
- [ ] Implement improvements
- [ ] Add analytics
- [ ] Document usage
- [ ] Community management

---

## Smart Contract Program ID
**Devnet**: `BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn`

## Current Status Summary
- **Phases Completed**: 1, 2, 3, 4, 5
- **Current Phase**: 6 (Testing)
- **Blocker**: Mint initialization (has workaround options)
- **Next Action**: Begin Phase 6 (Testing)

## Notes
- All smart contract instructions are implemented and deployed
- IDL is generated and available at `src/lib/idl/amafcoin.json`
- Wallet adapter libraries are installed and ready to use
- Mint initialization issue documented in Phase 3 Known Issues
- Frontend implementation complete with wallet integration, market listing, creation, betting, and daily AMAF claims
- Ready to proceed with testing phase
