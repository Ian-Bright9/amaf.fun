import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { SystemProgram, Transaction } from '@solana/web3.js'
=======
import { Connection, SystemProgram, Transaction } from '@solana/web3.js'
>>>>>>> main

import { getProgram } from '@/data/markets'
import { getMintPDA, getProgramAuthorityPDA, getClaimStatePDA, getOrCreateUserTokenAccount } from '@/data/tokens'
import { parseError, type ParsedError } from '@/lib/errors'
<<<<<<< HEAD
import { useConnection } from '@/lib/useConnection'
=======
>>>>>>> main

import './DailyAmafClaim.css'

export function DailyAmafClaim() {
  const { publicKey, connected, signTransaction } = useWallet()
<<<<<<< HEAD
  const connection = useConnection()
=======
>>>>>>> main
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
<<<<<<< HEAD
=======
      const connection = new Connection('https://api.devnet.solana.com')
>>>>>>> main
      const [claimStatePda] = getClaimStatePDA(publicKey!)

      const accountInfo = await connection.getAccountInfo(claimStatePda)
      if (accountInfo) {
<<<<<<< HEAD
        // DailyClaimState structure:
        // - Discriminator: 8 bytes (0-7)
        // - user: Pubkey: 32 bytes (8-39)
        // - last_claim: i64: 8 bytes (40-47)
        // Total: 48 bytes
        const lastClaimBytes = accountInfo.data.slice(40, 48)
        const lastClaim = new Date(Number(Buffer.from(lastClaimBytes).readBigUInt64LE()) * 1000)
=======
        const lastClaim = new Date(Number(accountInfo.data.slice(32, 40)) * 1000)
>>>>>>> main
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
<<<<<<< HEAD
      setError({ userMessage: 'Please connect your wallet to claim AMAF tokens', technicalDetails: null, errorCode: null })
      return
    }

    if (!signTransaction) {
      setError({ userMessage: 'Your wallet does not support signing transactions', technicalDetails: null, errorCode: null })
=======
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
>>>>>>> main
      return
    }

    setLoading(true)
    setError(null)

    try {
<<<<<<< HEAD


      const [mintAddress] = getMintPDA()

      const balance = await connection.getBalance(publicKey)
      if (balance === 0) {
        throw new Error('Insufficient SOL for transaction fee. Please get devnet SOL at https://faucet.solana.com')
      }

=======
      const connection = new Connection('https://api.devnet.solana.com')
>>>>>>> main
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      const [claimStatePda] = getClaimStatePDA(publicKey)
<<<<<<< HEAD
=======
      const [mintAddress] = getMintPDA()
>>>>>>> main
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
<<<<<<< HEAD

        const signedTx = await signTransaction(transaction)
        tx = await connection.sendRawTransaction(signedTx.serialize())
=======
        if (signTransaction) {
          const signedTx = await signTransaction(transaction)
          tx = await connection.sendRawTransaction(signedTx.serialize())
        } else {
          throw new Error('Wallet does not support signing transactions')
        }
>>>>>>> main
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
<<<<<<< HEAD
            <span className="error-text">{error.userMessage}</span>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
              type="button"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
          {error.technicalDetails && (
            <button
              className="error-details-toggle"
              onClick={() => setShowDetails(!showDetails)}
              type="button"
            >
              {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
            </button>
          )}
=======
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
>>>>>>> main
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
