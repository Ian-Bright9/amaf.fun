import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useState, useEffect, useCallback } from 'react'

import { WalletModal } from './WalletModal'
import { ClientOnly } from './ClientOnly'
import { getTokenBalances, formatBalance } from '@/data/balances'
import { useConnection } from '@/lib/useConnection'

import './WalletConnectButton.css'

export function WalletConnectButton() {
  const { publicKey, connected } = useWallet()
  const connection = useConnection()
  const [showModal, setShowModal] = useState(false)
  const [amafBalance, setAmafBalance] = useState(0)
  const [loadingBalance, setLoadingBalance] = useState(false)

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
  }, [publicKey, connection])

  // Only load balance once on initial connection
  useEffect(() => {
    if (connected && publicKey) {
      loadBalance()
    } else {
      setAmafBalance(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey])

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
          <ClientOnly>
            <div className="hidden-wallet-button">
              <WalletMultiButton />
            </div>
          </ClientOnly>
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
