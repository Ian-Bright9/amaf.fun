import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useCallback } from 'react'
import { SystemProgram } from '@solana/web3.js'
import { Link } from '@tanstack/react-router'

import { getProgram, getMarketPDA } from '@/data/markets'
import { getMintPDA, getUserMarketsCounterPDA } from '@/data/tokens'
import { parseError, type ParsedError } from '@/lib/errors'
import { useConnection } from '@/lib/useConnection'
import { ErrorBoundary } from '@/components/ErrorBoundary'

import './create.css'

export const Route = createFileRoute('/markets/create')({
  component: () => (
    <ErrorBoundary>
      <CreateMarketPage />
    </ErrorBoundary>
  ),
})

function CreateMarketPage() {
  const { publicKey, connected, signTransaction } = useWallet()
  const connection = useConnection()
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ParsedError | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Debug logging
  console.log('CreateMarketPage render - connected:', connected, 'publicKey:', publicKey?.toBase58(), 'connection:', !!connection)

  if (!connected) {
    return (
      <div className="create-market-page">
        <div className="connect-prompt">
          <p>Please connect your wallet to create a market</p>
        </div>
      </div>
    )
  }

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log('Question change:', e.target.value)
      setQuestion(e.target.value)
    } catch (err) {
      console.error('Error in handleQuestionChange:', err)
    }
  }, [])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      console.log('Description change:', e.target.value)
      setDescription(e.target.value)
    } catch (err) {
      console.error('Error in handleDescriptionChange:', err)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Form submitted')
    setError(null)

    if (!publicKey || !signTransaction) {
      console.log('Wallet not connected')
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    if (!question.trim() || !description.trim()) {
      console.log('Validation failed: empty fields')
      setError({ userMessage: 'Please fill in all fields', technicalDetails: null, errorCode: null })
      return
    }

    if (question.length > 100) {
      console.log('Validation failed: question too long')
      setError({ userMessage: 'Question must be 100 characters or less', technicalDetails: null, errorCode: null })
      return
    }

    if (description.length > 500) {
      console.log('Validation failed: description too long')
      setError({ userMessage: 'Description must be 500 characters or less', technicalDetails: null, errorCode: null })
      return
    }

    setLoading(true)
    try {
      console.log('Creating wallet adapter...')
      
      if (!connection) {
        throw new Error('Connection is not available')
      }
      
      if (!signTransaction) {
        throw new Error('Wallet signTransaction is not available')
      }
      
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any[]) => Promise.all(txs.map(signTransaction)),
      }
      
      console.log('Getting program...')
      const program = await getProgram(connection, walletAdapter)
      console.log('Program obtained successfully')

      console.log('Calculating PDAs...')
      const [userMarketsCounterPda] = getUserMarketsCounterPDA(publicKey)
      const [mintAddress] = getMintPDA()
      console.log('User markets counter PDA:', userMarketsCounterPda.toBase58())
      console.log('Mint PDA:', mintAddress.toBase58())

      let marketIndex = 0
      try {
        const counterAccount = await (program.account as any).userMarketsCounter.fetch(userMarketsCounterPda)
        marketIndex = counterAccount.count as number
        console.log('Current market count:', marketIndex)
      } catch (err) {
        console.log('Counter account not found, creating first market (index 0)')
      }

      const [marketPda] = getMarketPDA(publicKey, marketIndex)
      console.log('Market PDA:', marketPda.toBase58())

      console.log('Building transaction...')
      const tx = await program.methods
        .createMarket(marketIndex, question, description)
        .accounts({
          market: marketPda,
          userMarketsCounter: userMarketsCounterPda,
          authority: publicKey,
          mint: mintAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' })

      console.log('Market created with signature:', tx)
      await connection.confirmTransaction(tx, 'confirmed')
      router.navigate({ to: '/markets/$id', params: { id: marketPda.toBase58() } })
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
              onChange={handleQuestionChange}
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
              onChange={handleDescriptionChange}
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
