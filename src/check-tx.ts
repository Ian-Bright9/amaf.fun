import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const txSignature = '3MSBB9xEii8ySA77NJJSB2J8VdBZWotsrRxiFYPP2KJ1snbmKtAMVJSmjk43JpAvqSNy9NmAgMEg3QnNfPT5Bo9t';

console.log('Checking transaction:', txSignature);
console.log('Explorer: https://explorer.solana.com/tx/' + txSignature + '?cluster=devnet');
console.log();

const tx = await connection.getTransaction(txSignature, {
  maxSupportedTransactionVersion: 0,
  commitment: 'finalized'
});

if (!tx) {
  console.log('Transaction not found');
} else {
  console.log('Transaction found!');
  console.log('Slot:', tx.slot);
  console.log('Timestamp:', new Date((tx.blockTime || 0) * 1000).toISOString());
  console.log('Fee:', tx.meta?.fee, 'lamports');
  console.log('Status:', tx.meta?.err ? 'Failed' : 'Success');
  
  if (tx.meta?.err) {
    console.log('\n❌ Transaction FAILED!');
    console.log('Error:', tx.meta.err);
    
    if (tx.meta.logMessages) {
      console.log('\nLog Messages:');
      tx.meta.logMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg}`);
      });
    }
  } else {
    console.log('\n✅ Transaction succeeded!');
    
    if (tx.meta?.logMessages) {
      console.log('\nLog Messages:');
      tx.meta.logMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg}`);
      });
    }
    
    if (tx.meta?.innerInstructions) {
      console.log('\nInstructions:', tx.meta.innerInstructions.length);
      tx.meta.innerInstructions.forEach((ix, i) => {
        console.log(`  ${i + 1}. Program ID:`, ix.programId);
      });
    }
    
    // Check which accounts were written to
    if (tx.meta?.postBalances) {
      console.log('\nPost-transaction balances:');
      tx.meta.postBalances.forEach((bal, i) => {
        console.log(`  ${i + 1}. ${bal.pubkey}:`, balanceDiff(bal) + ' lamports');
      });
    }
    
    if (tx.meta?.postTokenBalances) {
      console.log('\nPost-transaction token balances:');
      tx.meta.postTokenBalances.forEach((bal, i) => {
        console.log(`  ${i + 1}. Account ${bal.accountIndex}:`, bal.uiTokenAmount?.amount, bal.uiTokenAmount?.decimals);
      });
    }
  }
}

function balanceDiff(bal: any): string {
  if (!bal.preBalance || !bal.postBalance) return 'N/A';
  const diff = Number(bal.postBalance) - Number(bal.preBalance);
  const sign = diff >= 0 ? '+' : '';
  return sign + diff;
}
