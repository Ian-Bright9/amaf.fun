import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useState, useEffect } from 'react'
import { Connection } from '@solana/web3.js'

import { WalletModal } from './WalletModal'
import { getTokenBalances, formatBalance } from '@/data/balances'

import './WalletConnectButton.css'

export function WalletConnectButton() {
  const { publicKey, connected } = useWallet()
  const [showModal, setShowModal] = useState(false)
  const [amafBalance, setAmafBalance] = useState(0)
  const [loadingBalance, setLoadingBalance] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance()
    } else {
      setAmafBalance(0)
    }
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
          <div className="hidden-wallet-button">
            <WalletMultiButton />
          </div>
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
