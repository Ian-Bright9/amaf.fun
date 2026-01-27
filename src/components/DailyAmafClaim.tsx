import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'
import { Connection, SystemProgram, Transaction } from '@solana/web3.js'

import { getProgram } from '@/data/markets'
import { getMintPDA, getProgramAuthorityPDA, getClaimStatePDA, getOrCreateUserTokenAccount } from '@/data/tokens'
import { parseError, type ParsedError } from '@/lib/errors'

import './DailyAmafClaim.css'

export function DailyAmafClaim() {
  const { publicKey, connected, signTransaction } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ParsedError | null>(null)
  const [showDetails, setShowDetails] = useState(false)
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
      const [claimStatePda] = getClaimStatePDA(publicKey!)

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
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const connection = new Connection('https://api.devnet.solana.com')
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      const [claimStatePda] = getClaimStatePDA(publicKey)
      const [mintAddress] = getMintPDA()
      const [authorityPda] = getProgramAuthorityPDA()

      const userTokenResult = await getOrCreateUserTokenAccount(
        publicKey,
        mintAddress,
        connection,
        publicKey
      )

      let tx: string
      if (userTokenResult.instruction) {
        const claimIx = await program.methods
          .claimDailyAmaf()
          .accounts({
            mint: mintAddress,
            programAuthority: authorityPda,
            userToken: userTokenResult.address,
            claimState: claimStatePda,
            user: publicKey,
            tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
            systemProgram: SystemProgram.programId,
          })
          .instruction()

        const { blockhash } = await connection.getLatestBlockhash()
        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: publicKey,
        }).add(userTokenResult.instruction, claimIx)
        if (signTransaction) {
          const signedTx = await signTransaction(transaction)
          tx = await connection.sendRawTransaction(signedTx.serialize())
        } else {
          throw new Error('Wallet does not support signing transactions')
        }
      } else {
        tx = await program.methods
          .claimDailyAmaf()
          .accounts({
            mint: mintAddress,
            programAuthority: authorityPda,
            userToken: userTokenResult.address,
            claimState: claimStatePda,
            user: publicKey,
            tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
            systemProgram: SystemProgram.programId,
          })
          .rpc()
      }

      console.log('Claimed daily AMAF with signature:', tx)
      setNextClaimTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    } catch (err) {
      console.error('Error claiming daily AMAF:', err)
      setError(parseError(err))
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
      {error && (
        <div className="error-message">
          <div className="error-content">
            {error.userMessage}
            {error.technicalDetails && (
              <button
                className="error-details-toggle"
                onClick={() => setShowDetails(!showDetails)}
                type="button"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            )}
          </div>
          {showDetails && error.technicalDetails && (
            <div className="error-technical">
              <pre>{error.technicalDetails}</pre>
            </div>
          )}
        </div>
      )}
      <button
        className="button button-primary"
        onClick={handleClaim}
        disabled={loading || !!timeRemaining}
      >
        {loading ? 'Claiming...' : timeRemaining ? 'Claimed' : 'Claim ¤100'}
      </button>
    </div>
  )
}
