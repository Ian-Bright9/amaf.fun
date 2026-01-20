import { writable, derived, type Readable } from 'svelte/store';
import type { WalletState } from '../../types/index.js';

const createWalletStore = () => {
	const { subscribe, set, update } = writable<WalletState>({
		publicKey: null,
		connected: false,
		balance: 0,
		amafBalance: 0,
		lastClaimTime: null,
		lastClaim: null
	});

	return {
		subscribe,
		setPublicKey: (publicKey: string | null) => update((_state) => ({ ..._state, publicKey })),
		setConnected: (connected: boolean) => update((_state) => ({ ..._state, connected })),
		setBalance: (balance: number) => update((_state) => ({ ..._state, balance })),
		setAmafBalance: (amafBalance: number) => update((_state) => ({ ..._state, amafBalance })),
		setLastClaimTime: (lastClaimTime: string | null) =>
			update((_state) => ({ ..._state, lastClaimTime })),
		setLastClaim: (lastClaim: number | null) => update((_state) => ({ ..._state, lastClaim })),
		connect: () => update((_state) => ({ ..._state, connected: true })),
		disconnect: () =>
			update((_state) => ({
				publicKey: null,
				connected: false,
				balance: 0,
				amafBalance: 0,
				lastClaimTime: null,
				lastClaim: null
			})),
		reset: () =>
			set({
				publicKey: null,
				connected: false,
				balance: 0,
				amafBalance: 0,
				lastClaimTime: null,
				lastClaim: null
			})
	};
};

export const walletStore = createWalletStore();

export const isConnected: Readable<boolean> = derived(
	walletStore,
	($walletStore) => $walletStore.connected
);

export const canClaimDaily: Readable<boolean> = derived(walletStore, ($walletStore) => {
	if (!$walletStore.lastClaimTime) return true;

	const lastClaim = new Date($walletStore.lastClaimTime);
	const now = new Date();
	const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

	return hoursSinceClaim >= 24;
});
