<<<<<<< HEAD
=======
'use client'

>>>>>>> main
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import '@solana/wallet-adapter-react-ui/styles.css'

export function WalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={clusterApiUrl('devnet')}>
<<<<<<< HEAD
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
=======
      <SolanaWalletProvider wallets={wallets} autoConnect>
>>>>>>> main
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
