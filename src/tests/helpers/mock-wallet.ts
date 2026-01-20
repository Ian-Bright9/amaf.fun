import type { WalletAdapter } from '../../types/index.js';

export class MockWalletAdapter implements WalletAdapter {
	publicKey: { toBase58: () => string } | null;
	connected: boolean;
	balance: number;
	amafBalance: number;
	private _connectError: Error | null;
	private _disconnectError: Error | null;
	private _signError: Error | null;

	constructor(options?: { publicKey?: string; balance?: number; amafBalance?: number }) {
		const key = options?.publicKey ?? '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
		this.publicKey = { toBase58: () => key };
		this.connected = false;
		this.balance = options?.balance ?? 10;
		this.amafBalance = options?.amafBalance ?? 1000;
		this._connectError = null;
		this._disconnectError = null;
		this._signError = null;
	}

	async connect(): Promise<void> {
		if (this._connectError) {
			throw this._connectError;
		}
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		if (this._disconnectError) {
			throw this._disconnectError;
		}
		this.connected = false;
	}

	async signTransaction(transaction: any): Promise<any> {
		if (this._signError) {
			throw this._signError;
		}
		return transaction;
	}

	async signAllTransactions(transactions: any[]): Promise<any[]> {
		if (this._signError) {
			throw this._signError;
		}
		return transactions;
	}

	async sendTransaction(transaction: any): Promise<string> {
		if (this._signError) {
			throw this._signError;
		}
		return 'mock_tx_signature_' + Math.random().toString(36).substring(7);
	}

	setPublicKey(key: string | null): void {
		this.publicKey = key ? { toBase58: () => key } : null;
	}

	setBalance(amount: number): void {
		this.balance = amount;
	}

	setAmafBalance(amount: number): void {
		this.amafBalance = amount;
	}

	setConnectError(error: Error | null): void {
		this._connectError = error;
	}

	setDisconnectError(error: Error | null): void {
		this._disconnectError = error;
	}

	setSignError(error: Error | null): void {
		this._signError = error;
	}

	reset(): void {
		this.connected = false;
		this._connectError = null;
		this._disconnectError = null;
		this._signError = null;
	}
}
