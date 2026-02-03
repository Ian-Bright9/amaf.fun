import { useWallet } from '@solana/wallet-adapter-react'
<<<<<<< HEAD
import { useState, useEffect, useCallback, useRef } from 'react'

import { getTokenBalances, formatBalance, requestDevnetAirdrop } from '@/data/balances'
import { useConnection } from '@/lib/useConnection'
=======
import { useState, useEffect } from 'react'
import { Connection } from '@solana/web3.js'

import { getTokenBalances, formatBalance, requestDevnetAirdrop } from '@/data/balances'
>>>>>>> main

import './WalletModal.css'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { publicKey, disconnect } = useWallet()
<<<<<<< HEAD
  const connection = useConnection()
=======
>>>>>>> main
  const [amafBalance, setAmafBalance] = useState(0)
  const [solBalance, setSolBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [airdropping, setAirdropping] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)
<<<<<<< HEAD
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const loadBalances = useCallback(async () => {
=======

  const loadBalances = async () => {
>>>>>>> main
    if (!publicKey || !isOpen) return

    setLoading(true)
    setError('')
    try {
<<<<<<< HEAD
=======
      const connection = new Connection('https://api.devnet.solana.com')
>>>>>>> main
      const balances = await getTokenBalances(publicKey, connection)
      setAmafBalance(balances.amafBalance)
      setSolBalance(balances.solBalance)
    } catch (err) {
      console.error('Error loading balances:', err)
      setError('Failed to load balances')
    } finally {
      setLoading(false)
    }
<<<<<<< HEAD
  }, [publicKey, isOpen, connection, getTokenBalances])
=======
  }
>>>>>>> main

  useEffect(() => {
    if (isOpen) {
      loadBalances()
    }
<<<<<<< HEAD
  }, [isOpen, loadBalances])
=======
  }, [isOpen, publicKey])
>>>>>>> main

  async function handleAirdrop() {
    if (!publicKey) return

    setAirdropping(true)
    setError('')
    setSuccess('')

    try {
<<<<<<< HEAD
      await requestDevnetAirdrop(publicKey, connection)
      setSuccess('Airdrop successful! Refreshing balances...')

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
=======
      const connection = new Connection('https://api.devnet.solana.com')
      await requestDevnetAirdrop(publicKey, connection)
      setSuccess('Airdrop successful! Refreshing balances...')
      
      setTimeout(() => {
>>>>>>> main
        loadBalances()
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      console.error('Error requesting airdrop:', err)
      if (err.message?.includes('429')) {
        setError('Airdrop request too frequent. Please wait a few seconds.')
      } else {
        setError('Airdrop failed. Please try again.')
      }
    } finally {
      setAirdropping(false)
    }
  }

  async function handleCopyAddress() {
    if (!publicKey) return

    try {
      await navigator.clipboard.writeText(publicKey.toBase58())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  async function handleDisconnect() {
    try {
      disconnect()
      onClose()
    } catch (err) {
      console.error('Error disconnecting wallet:', err)
    }
  }

  if (!isOpen || !publicKey) return null

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2 className="wallet-modal-title">Wallet</h2>
          <button className="wallet-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="wallet-modal-content">
          <div className="wallet-address-section">
            <div className="wallet-address-label">Address</div>
            <div className="wallet-address-row">
              <span className="wallet-full-address">
                {publicKey.toBase58()}
              </span>
              <button 
                className="copy-address-button"
                onClick={handleCopyAddress}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="balances-section">
            <div className="balance-card amaf-balance">
              <div className="balance-label">AMAF Balance</div>
              <div className="balance-value">
                {loading ? '...' : `¤${formatBalance(amafBalance)}`}
              </div>
              <div className="balance-ticker">AMAF</div>
            </div>

            <div className="balance-card sol-balance">
              <div className="balance-label">SOL Balance</div>
              <div className="balance-value">
                {loading ? '...' : formatBalance(solBalance, 4)}
              </div>
              <div className="balance-ticker">SOL</div>
            </div>
          </div>

          <div className="airdrop-section">
            <div className="airdrop-info">
              <p className="airdrop-description">
                Need SOL for transactions? Request a devnet airdrop.
              </p>
            </div>
            <button
              className="airdrop-button"
              onClick={handleAirdrop}
              disabled={airdropping}
            >
              {airdropping ? 'Requesting...' : 'Request 2 SOL Airdrop'}
            </button>
          </div>

          {error && (
            <div className="wallet-error-message">{error}</div>
          )}

          {success && (
            <div className="wallet-success-message">{success}</div>
          )}

          <div className="wallet-modal-footer">
            <button className="disconnect-button" onClick={handleDisconnect}>
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
