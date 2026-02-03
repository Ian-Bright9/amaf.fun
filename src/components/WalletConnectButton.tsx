import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
<<<<<<< HEAD
import { useState, useEffect, useCallback } from 'react'

import { WalletModal } from './WalletModal'
import { ClientOnly } from './ClientOnly'
import { getTokenBalances, formatBalance } from '@/data/balances'
import { useConnection } from '@/lib/useConnection'
=======
import { useState, useEffect } from 'react'
import { Connection } from '@solana/web3.js'

import { WalletModal } from './WalletModal'
import { getTokenBalances, formatBalance } from '@/data/balances'
>>>>>>> main

import './WalletConnectButton.css'

export function WalletConnectButton() {
  const { publicKey, connected } = useWallet()
<<<<<<< HEAD
  const connection = useConnection()
=======
>>>>>>> main
  const [showModal, setShowModal] = useState(false)
  const [amafBalance, setAmafBalance] = useState(0)
  const [loadingBalance, setLoadingBalance] = useState(false)

<<<<<<< HEAD
  const loadBalance = useCallback(async () => {
    if (!publicKey) return

    setLoadingBalance(true)
    try {
      const balances = await getTokenBalances(publicKey, connection)
      setAmafBalance(balances.amafBalance)
    } catch (err) {
      console.error('Error loading balance:', err)
    } finally {
      setLoadingBalance(false)
    }
  }, [publicKey, connection, getTokenBalances])

=======
>>>>>>> main
  useEffect(() => {
    if (connected && publicKey) {
      loadBalance()
    } else {
      setAmafBalance(0)
    }
<<<<<<< HEAD
  }, [connected, publicKey, loadBalance])
=======
  }, [connected, publicKey])

  async function loadBalance() {
    if (!publicKey) return

    setLoadingBalance(true)
    try {
      const connection = new Connection('https://api.devnet.solana.com')
      const balances = await getTokenBalances(publicKey, connection)
      setAmafBalance(balances.amafBalance)
    } catch (err) {
      console.error('Error loading balance:', err)
    } finally {
      setLoadingBalance(false)
    }
  }
>>>>>>> main

  function handleWalletClick() {
    if (connected && publicKey) {
      setShowModal(true)
    }
  }

  return (
    <>
      <div className="wallet-connect">
        {connected && publicKey && (
          <button 
            className="wallet-info-button"
            onClick={handleWalletClick}
            disabled={loadingBalance}
          >
            <span className="wallet-address">
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </span>
            <span className="wallet-separator">•</span>
            <span className="wallet-amaf-balance">
              {loadingBalance ? '...' : `¤${formatBalance(amafBalance)}`}
            </span>
          </button>
        )}
        {!connected && (
<<<<<<< HEAD
          <ClientOnly>
            <div className="hidden-wallet-button">
              <WalletMultiButton />
            </div>
          </ClientOnly>
=======
          <div className="hidden-wallet-button">
            <WalletMultiButton />
          </div>
>>>>>>> main
        )}
      </div>
      
      <WalletModal 
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          loadBalance()
        }}
      />
    </>
  )
}
