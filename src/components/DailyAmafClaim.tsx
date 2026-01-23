import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'
import { Connection, PublicKey, SystemProgram, Keypair } from '@solana/web3.js'
import { Link } from '@tanstack/react-router'

import { getProgram } from '@/data/markets'

import './DailyAmafClaim.css'

export function DailyAmafClaim() {
  const { publicKey, connected, signTransaction } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    if (connected && publicKey) {
      checkLastClaim()
    }
  }, [connected, publicKey])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (nextClaimTime && nextClaimTime > new Date()) {
      interval = setInterval(updateTimeRemaining, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [nextClaimTime])

  async function checkLastClaim() {
    try {
      const connection = new Connection('https://api.devnet.solana.com')
      const [claimStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('claim'), publicKey!.toBuffer()],
        new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn')
      )

      const accountInfo = await connection.getAccountInfo(claimStatePda)
      if (accountInfo) {
        const lastClaim = new Date(Number(accountInfo.data.slice(32, 40)) * 1000)
        const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
        if (nextClaim > new Date()) {
          setNextClaimTime(nextClaim)
        }
      }
    } catch (err) {
      console.error('Error checking last claim:', err)
    }
  }

  function updateTimeRemaining() {
    if (!nextClaimTime) return

    const now = new Date()
    const diff = nextClaimTime.getTime() - now.getTime()

    if (diff <= 0) {
      setNextClaimTime(null)
      setTimeRemaining('')
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
  }

  async function handleClaim() {
    if (!connected || !publicKey) {
      setError('Please connect your wallet')
      return
    }

    setLoading(true)
    setError('')

    try {
      const connection = new Connection('https://api.devnet.solana.com')
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs) => Promise.all(txs.map(signTransaction)),
      })

      const [claimStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('claim'), publicKey.toBuffer()],
        new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn')
      )

      const mintAddress = new PublicKey('7jFf6MvXzqjEzF9F5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5')

      const tx = await program.methods
        .claimDailyAmaf()
        .accounts({
          mint: mintAddress,
          programAuthority: new PublicKey('BsgAgqUeekDVXqabqQXE5BZWYbhpH43zbdVanKQUpVnn'),
          userToken: await getUserTokenAccount(publicKey, mintAddress, connection),
          claimState: claimStatePda,
          user: publicKey,
          tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log('Claimed daily AMAF with signature:', tx)
      setNextClaimTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    } catch (err) {
      console.error('Error claiming daily AMAF:', err)
      setError('Failed to claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return null
  }

  return (
    <div className="daily-claim">
      <div className="claim-header">
        <h3>Daily AMAF</h3>
        {timeRemaining && <span className="countdown">{timeRemaining}</span>}
      </div>
      <p className="claim-description">
        Claim your free AMAF tokens every 24 hours
      </p>
      {error && <div className="error-message">{error}</div>}
      <button
        className="button button-primary"
        onClick={handleClaim}
        disabled={loading || !!timeRemaining}
      >
        {loading ? 'Claiming...' : timeRemaining ? 'Claimed' : 'Claim 100 AMAF'}
      </button>
    </div>
  )
}

async function getUserTokenAccount(
  user: PublicKey,
  mint: PublicKey,
  connection: Connection
): Promise<PublicKey> {
  return new PublicKey('7jFf6MvXzqjEzF9F5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5')
}
