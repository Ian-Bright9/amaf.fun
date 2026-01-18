import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor/target/types/amafcoin';
import { PublicKey } from '@solana/web3.js';

describe('amafcoin', () => {
	const provider = anchor.AnchorProvider.env();
	const program = new Program(
		Program,
		new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLn'),
		provider
	);

	it('Initializes the counter', async () => {
		// Add test code here once basic program is verified
		console.log('Test placeholder');
	});
});
