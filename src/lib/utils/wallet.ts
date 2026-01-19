import { Transaction, type VersionedTransaction, type PublicKey } from '@solana/web3.js';

export async function signTransactionFromBase64(
	base64Tx: string,
	walletAdapter: any,
	connection: any
): Promise<string> {
	try {
		if (!walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const txBuffer = Buffer.from(base64Tx, 'base64');
		const transaction = Transaction.from(txBuffer);

		const signedTx = await walletAdapter.signTransaction(transaction);
		const signature = await connection.sendRawTransaction(signedTx.serialize(), {
			skipPreflight: false,
			preflightCommitment: 'confirmed'
		});

		await connection.confirmTransaction(signature, 'confirmed');

		return signature;
	} catch (error) {
		console.error('Error signing transaction:', error);
		throw error instanceof Error ? error : new Error('Failed to sign transaction');
	}
}

export async function signAndSendTransaction(
	transaction: Transaction,
	walletAdapter: any,
	connection: any
): Promise<string> {
	try {
		if (!walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const { blockhash } = await connection.getLatestBlockhash();
		transaction.recentBlockhash = blockhash;
		transaction.feePayer = walletAdapter.publicKey;

		const signedTx = await walletAdapter.signTransaction(transaction);
		const signature = await connection.sendRawTransaction(signedTx.serialize(), {
			skipPreflight: false,
			preflightCommitment: 'confirmed'
		});

		await connection.confirmTransaction(signature, 'confirmed');

		return signature;
	} catch (error) {
		console.error('Error signing transaction:', error);
		throw error instanceof Error ? error : new Error('Failed to sign transaction');
	}
}

export async function signAndSendAllTransactions(
	transactions: Transaction[],
	walletAdapter: any,
	connection: any
): Promise<string[]> {
	try {
		if (!walletAdapter.connected) {
			throw new Error('Wallet not connected');
		}

		const { blockhash } = await connection.getLatestBlockhash();
		const signedTxs = [];

		for (const tx of transactions) {
			tx.recentBlockhash = blockhash;
			tx.feePayer = walletAdapter.publicKey;
			const signedTx = await walletAdapter.signTransaction(tx);
			signedTxs.push(signedTx);
		}

		const signatures = await Promise.all(
			signedTxs.map((signedTx) =>
				connection.sendRawTransaction(signedTx.serialize(), {
					skipPreflight: false,
					preflightCommitment: 'confirmed'
				})
			)
		);

		await Promise.all(signatures.map((sig) => connection.confirmTransaction(sig, 'confirmed')));

		return signatures;
	} catch (error) {
		console.error('Error signing transactions:', error);
		throw error instanceof Error ? error : new Error('Failed to sign transactions');
	}
}

export async function getBalance(connection: any, publicKey: PublicKey): Promise<number> {
	const balance = await connection.getBalance(publicKey);
	return balance;
}
