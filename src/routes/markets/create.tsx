import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { SystemProgram } from '@solana/web3.js'
import { Link } from '@tanstack/react-router'

import { getProgram, getMarketPDA } from '@/data/markets'
import { getMintPDA } from '@/data/tokens'
import { parseError, type ParsedError } from '@/lib/errors'
import { useConnection } from '@/lib/useConnection'

import './create.css'

export const Route = createFileRoute('/markets/create')({ component: CreateMarketPage })

function CreateMarketPage() {
  const { publicKey, connected, signTransaction } = useWallet()
  const connection = useConnection()
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ParsedError | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  if (!connected) {
    return (
      <div className="create-market-page">
        <div className="connect-prompt">
          <p>Please connect your wallet to create a market</p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!publicKey) {
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    if (!question.trim() || !description.trim()) {
      setError({ userMessage: 'Please fill in all fields', technicalDetails: null, errorCode: null })
      return
    }

    if (question.length > 100) {
      setError({ userMessage: 'Question must be 100 characters or less', technicalDetails: null, errorCode: null })
      return
    }

    if (description.length > 500) {
      setError({ userMessage: 'Description must be 500 characters or less', technicalDetails: null, errorCode: null })
      return
    }

    setLoading(true)
    try {
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      const [marketPda] = getMarketPDA(publicKey)
      const [mintAddress] = getMintPDA()

      const tx = await program.methods
        .createMarket(question, description)
        .accounts({
          market: marketPda,
          authority: publicKey,
          mint: mintAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log('Market created with signature:', tx)
      router.navigate({ to: '/markets' })
    } catch (err) {
      console.error('Error creating market:', err)
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-market-page">
      <div className="page-header">
        <h1>Create Market</h1>
        <Link to="/markets" className="button button-secondary">
          Back to Markets
        </Link>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="create-market-form">
          <div className="form-group">
            <label htmlFor="question">Question</label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will Bitcoin reach $100,000 by end of 2024?"
              maxLength={100}
              disabled={loading}
            />
            <span className="char-count">{question.length}/100</span>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about this prediction market..."
              rows={6}
              maxLength={500}
              disabled={loading}
            />
            <span className="char-count">{description.length}/500</span>
          </div>

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

          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Creating Market...' : 'Create Market'}
          </button>
        </form>
      </div>
    </div>
  )
}
