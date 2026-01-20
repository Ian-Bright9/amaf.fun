import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor/target/types/amafcoin';
import { PublicKey } from '@solana/web3.js';

describe('amafcoin', () => {
	const provider = anchor.AnchorProvider.env();
	const program = new Program(
		Program,
		new PublicKey('FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE'),
		provider
	);

	it('Initializes the counter', async () => {
		// Add test code here once basic program is verified
		console.log('Test placeholder');
	});
});
