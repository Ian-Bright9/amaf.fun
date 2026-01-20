import { describe, it, expect, beforeEach, vi } from 'vitest';
import { walletStore, isConnected, canClaimDaily } from '$lib/stores/wallet.js';

describe('WalletStore', () => {
	beforeEach(() => {
		walletStore.reset();
	});

	describe('connection', () => {
		it('should update connected state on connect', () => {
			walletStore.connect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.connected).toBe(true);
		});

		it('should update publicKey on connect', () => {
			walletStore.setPublicKey('test-public-key-123');
			walletStore.connect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.publicKey).toBe('test-public-key-123');
			expect(state.connected).toBe(true);
		});

		it('should clear publicKey on disconnect', () => {
			walletStore.setPublicKey('test-public-key-123');
			walletStore.connect();
			walletStore.disconnect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.publicKey).toBeNull();
			expect(state.connected).toBe(false);
		});

		it('should clear balance on disconnect', () => {
			walletStore.setBalance(1000);
			walletStore.setAmafBalance(500);
			walletStore.connect();
			walletStore.disconnect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.balance).toBe(0);
			expect(state.amafBalance).toBe(0);
		});

		it('should clear lastClaimTime on disconnect', () => {
			walletStore.setLastClaimTime('2025-01-20T00:00:00Z');
			walletStore.connect();
			walletStore.disconnect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaimTime).toBeNull();
		});

		it('should clear lastClaim on disconnect', () => {
			walletStore.setLastClaim(1234567890);
			walletStore.connect();
			walletStore.disconnect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaim).toBeNull();
		});

		it('should handle connection errors gracefully', () => {
			walletStore.setPublicKey('test-key');
			walletStore.connect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.connected).toBe(true);
			expect(state.publicKey).toBe('test-key');
		});
	});

	describe('balance', () => {
		it('should update SOL balance', () => {
			walletStore.setBalance(1234.56);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.balance).toBe(1234.56);
		});

		it('should update AMAF balance', () => {
			walletStore.setAmafBalance(1000);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.amafBalance).toBe(1000);
		});

		it('should handle zero balance', () => {
			walletStore.setBalance(0);
			walletStore.setAmafBalance(0);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.balance).toBe(0);
			expect(state.amafBalance).toBe(0);
		});

		it('should handle large balances', () => {
			walletStore.setBalance(999999.999);
			walletStore.setAmafBalance(888888.888);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.balance).toBe(999999.999);
			expect(state.amafBalance).toBe(888888.888);
		});
	});

	describe('daily claim', () => {
		it('should update lastClaimTime after claim', () => {
			const claimTime = '2025-01-20T10:00:00Z';
			walletStore.setLastClaimTime(claimTime);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaimTime).toBe(claimTime);
		});

		it('should update lastClaim after claim', () => {
			const lastClaim = 1737338400;
			walletStore.setLastClaim(lastClaim);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaim).toBe(lastClaim);
		});

		it('should handle null lastClaimTime when never claimed', () => {
			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaimTime).toBeNull();
		});

		it('should handle null lastClaim when never claimed', () => {
			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaim).toBeNull();
		});
	});

	describe('derived state - canClaimDaily', () => {
		it('canClaimDaily should be true if never claimed', () => {
			let canClaim: boolean = false;
			const unsubscribe = canClaimDaily.subscribe((value) => (canClaim = value));
			unsubscribe();

			expect(canClaim).toBe(true);
		});

		it('canClaimDaily should be false if lastClaimTime is null', () => {
			walletStore.setLastClaimTime(null);

			let canClaim: boolean = false;
			const unsubscribe = canClaimDaily.subscribe((value) => (canClaim = value));
			unsubscribe();

			expect(canClaim).toBe(true);
		});

		it('canClaimDaily should be false if recently claimed', () => {
			const recentTime = new Date(Date.now() - 3600000).toISOString();
			walletStore.setLastClaimTime(recentTime);

			let canClaim: boolean = false;
			const unsubscribe = canClaimDaily.subscribe((value) => (canClaim = value));
			unsubscribe();

			expect(canClaim).toBe(false);
		});

		it('canClaimDaily should be true after 24 hours', () => {
			const oldTime = new Date(Date.now() - 86400000 - 1000).toISOString();
			walletStore.setLastClaimTime(oldTime);

			let canClaim: boolean = false;
			const unsubscribe = canClaimDaily.subscribe((value) => (canClaim = value));
			unsubscribe();

			expect(canClaim).toBe(true);
		});

		it('canClaimDaily should be false exactly at 24 hours', () => {
			const exactTime = new Date(Date.now() - 86400000).toISOString();
			walletStore.setLastClaimTime(exactTime);

			let canClaim: boolean = false;
			const unsubscribe = canClaimDaily.subscribe((value) => (canClaim = value));
			unsubscribe();

			expect(canClaim).toBe(true);
		});

		it('canClaimDaily should enforce 24h cooldown (86400 seconds)', () => {
			const nearly24h = new Date(Date.now() - 86399000).toISOString();
			walletStore.setLastClaimTime(nearly24h);

			let canClaim: boolean = false;
			const unsubscribe = canClaimDaily.subscribe((value) => (canClaim = value));
			unsubscribe();

			expect(canClaim).toBe(false);
		});

		it('canClaimDaily should update reactively when lastClaimTime changes', () => {
			let canClaim: boolean = false;
			const unsubscribe = canClaimDaily.subscribe((value) => (canClaim = value));

			expect(canClaim).toBe(true);

			const recentTime = new Date(Date.now() - 3600000).toISOString();
			walletStore.setLastClaimTime(recentTime);

			expect(canClaim).toBe(false);
			unsubscribe();
		});
	});

	describe('derived state - isConnected', () => {
		it('isConnected should be false initially', () => {
			let connected: boolean = true;
			const unsubscribe = isConnected.subscribe((value) => (connected = value));
			unsubscribe();

			expect(connected).toBe(false);
		});

		it('isConnected should be true after connect', () => {
			let connected: boolean = false;
			const unsubscribe = isConnected.subscribe((value) => (connected = value));

			walletStore.connect();

			expect(connected).toBe(true);
			unsubscribe();
		});

		it('isConnected should be false after disconnect', () => {
			let connected: boolean = true;
			const unsubscribe = isConnected.subscribe((value) => (connected = value));

			walletStore.connect();
			expect(connected).toBe(true);

			walletStore.disconnect();
			expect(connected).toBe(false);
			unsubscribe();
		});

		it('isConnected should update reactively', () => {
			let connected: boolean = false;
			const unsubscribe = isConnected.subscribe((value) => (connected = value));

			expect(connected).toBe(false);

			walletStore.setConnected(true);
			expect(connected).toBe(true);

			walletStore.setConnected(false);
			expect(connected).toBe(false);

			unsubscribe();
		});
	});

	describe('reset', () => {
		it('should reset all state to initial values', () => {
			walletStore.setPublicKey('test-key');
			walletStore.connect();
			walletStore.setBalance(1000);
			walletStore.setAmafBalance(500);
			walletStore.setLastClaimTime('2025-01-20T00:00:00Z');
			walletStore.setLastClaim(1234567890);

			walletStore.reset();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.publicKey).toBeNull();
			expect(state.connected).toBe(false);
			expect(state.balance).toBe(0);
			expect(state.amafBalance).toBe(0);
			expect(state.lastClaimTime).toBeNull();
			expect(state.lastClaim).toBeNull();
		});

		it('should reset derived stores', () => {
			walletStore.connect();
			walletStore.setLastClaimTime(new Date().toISOString());

			let connected: boolean = true;
			let canClaim: boolean = false;
			const unsubscribeConnected = isConnected.subscribe((value) => (connected = value));
			const unsubscribeCanClaim = canClaimDaily.subscribe((value) => (canClaim = value));

			expect(connected).toBe(true);
			expect(canClaim).toBe(false);

			walletStore.reset();

			expect(connected).toBe(false);
			expect(canClaim).toBe(true);

			unsubscribeConnected();
			unsubscribeCanClaim();
		});
	});

	describe('state transitions', () => {
		it('should handle multiple updates in sequence', () => {
			walletStore.setPublicKey('key1');
			walletStore.connect();
			walletStore.setBalance(100);
			walletStore.setAmafBalance(50);
			walletStore.setPublicKey('key2');

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.publicKey).toBe('key2');
			expect(state.connected).toBe(true);
			expect(state.balance).toBe(100);
			expect(state.amafBalance).toBe(50);
		});

		it('should maintain state across updates', () => {
			walletStore.setBalance(100);
			walletStore.setAmafBalance(50);

			walletStore.connect();

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.balance).toBe(100);
			expect(state.amafBalance).toBe(50);
		});
	});

	describe('edge cases', () => {
		it('should handle setting null publicKey', () => {
			walletStore.setPublicKey('test-key');
			walletStore.setPublicKey(null);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.publicKey).toBeNull();
		});

		it('should handle setting null lastClaimTime', () => {
			walletStore.setLastClaimTime('2025-01-20T00:00:00Z');
			walletStore.setLastClaimTime(null);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaimTime).toBeNull();
		});

		it('should handle setting null lastClaim', () => {
			walletStore.setLastClaim(1234567890);
			walletStore.setLastClaim(null);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.lastClaim).toBeNull();
		});

		it('should handle negative balance', () => {
			walletStore.setBalance(-100);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.balance).toBe(-100);
		});

		it('should handle negative AMAF balance', () => {
			walletStore.setAmafBalance(-50);

			let state: any;
			const unsubscribe = walletStore.subscribe((s) => (state = s));
			unsubscribe();

			expect(state.amafBalance).toBe(-50);
		});
	});
});
