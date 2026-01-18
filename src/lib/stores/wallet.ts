import { writable, derived, type Readable } from 'svelte/store';
import type { WalletState } from '../../types/index.js';

const createWalletStore = () => {
	const { subscribe, set, update } = writable<WalletState>({
		publicKey: null,
		connected: false,
		balance: 0
	});

	return {
		subscribe,
		setPublicKey: (publicKey: string | null) => update((_state) => ({ ..._state, publicKey })),
		setConnected: (connected: boolean) => update((_state) => ({ ..._state, connected })),
		setBalance: (balance: number) => update((_state) => ({ ..._state, balance })),
		connect: () => update((_state) => ({ ..._state, connected: true })),
		disconnect: () => update((_state) => ({ publicKey: null, connected: false, balance: 0 })),
		reset: () => set({ publicKey: null, connected: false, balance: 0 })
	};
};

export const walletStore = createWalletStore();

export const isConnected: Readable<boolean> = derived(
	walletStore,
	($walletStore) => $walletStore.connected
);
