import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useCallback } from 'react'
import { SystemProgram, PublicKey, Transaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { Link } from '@tanstack/react-router'

import { getProgram, getMarketPDA, PROGRAM_ID, ensureMintInitialized } from '@/data/markets'
import { getMintPDA, getUserMarketsCounterPDA, getEscrowTokenAccount } from '@/data/tokens'
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
  const [marketType, setMarketType] = useState<'binary' | 'multi'>('binary')
  const [options, setOptions] = useState<string[]>(['YES', 'NO'])
  const [newOption, setNewOption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ParsedError | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [verifyingMarket, setVerifyingMarket] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [lastTxSignature, setLastTxSignature] = useState('')

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

  const handleAddOption = () => {
    if (newOption.trim() && options.length < 16) {
      setOptions([...options, newOption.trim()])
      setNewOption('')
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Form submitted')
    setError(null)

    if (!publicKey || !signTransaction) {
      console.log('Wallet not connected')
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    if (!question.trim() || !description.trim() || options.length < 2) {
      console.log('Validation failed: empty fields')
      setError({ userMessage: 'Please fill in all fields and add at least 2 options', technicalDetails: null, errorCode: null })
      return
    }

    if (question.length > 200) {
      console.log('Validation failed: question too long')
      setError({ userMessage: 'Question must be 200 characters or less', technicalDetails: null, errorCode: null })
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

      console.log('Ensuring mint is initialized...')
      await ensureMintInitialized(connection, walletAdapter)
      console.log('Mint initialized or already exists')

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
        .createMarket(marketIndex, question, description, options)
        .accounts({
          market: marketPda,
          userMarketsCounter: userMarketsCounterPda,
          authority: publicKey,
          mint: mintAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' })

      console.log('Market created with signature:', tx)
      setLastTxSignature(tx)
      setStatusMessage('Confirming transaction...')
      
      const confirmation = await connection.confirmTransaction(tx, 'finalized')
      console.log('Transaction confirmation:', confirmation)
      
      if (confirmation.value.err) {
        console.error('Transaction failed with error:', confirmation.value.err)
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }
      
      setStatusMessage('Verifying market account...')
      setVerifyingMarket(true)
      
      setStatusMessage('Verifying market account...')
      setVerifyingMarket(true)
      
      let finalMarketPda: PublicKey | null = null
      let retries = 0
      const maxRetries = 30
      
      while (retries < maxRetries) {
        try {
          setStatusMessage(`Verifying market account... (attempt ${retries + 1}/${maxRetries})`)
          
          // First, try fetching the counter to see what index was used
          console.log('Fetching counter...')
          const counterInfo = await connection.getAccountInfo(userMarketsCounterPda)
          
          if (!counterInfo) {
            throw new Error('Counter account not found - transaction may have failed')
          }
          
          if (counterInfo.owner.toBase58() !== PROGRAM_ID.toBase58()) {
            console.error('⚠️ Counter owned by different program:', counterInfo.owner.toBase58())
            console.error('Expected program:', PROGRAM_ID.toBase58())
            throw new Error('Counter account owned by different program')
          }
          
          // Read counter value from raw data
          const countData = counterInfo.data.slice(40, 42)
          const count = countData.readUInt16LE(0)
          console.log('Counter count:', count)
          
          // The market was created at index (count - 1)
          const createdAtIndex = count - 1
          console.log('Market created at index:', createdAtIndex)
          
          // Calculate market PDA
          const [marketPda] = getMarketPDA(publicKey, createdAtIndex)
          console.log('Market PDA:', marketPda.toBase58())
          finalMarketPda = marketPda
          
          // Try fetching with Anchor first
          const marketAccount = await (program.account as any).market.fetch(marketPda)
          console.log('Market account verified successfully:', {
            question: marketAccount.question,
            authority: marketAccount.authority.toString(),
            marketIndex: marketAccount.marketIndex
          })

          setStatusMessage('Creating escrow token account...')
          const escrowTokenAddress = getEscrowTokenAccount(marketPda, mintAddress)
          console.log('Escrow token address:', escrowTokenAddress.toBase58())

          const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAddress)
          if (!escrowAccountInfo) {
            console.log('Creating escrow token account...')
            const createEscrowIx = createAssociatedTokenAccountInstruction(
              publicKey,
              escrowTokenAddress,
              marketPda,
              mintAddress
            )
            const { blockhash } = await connection.getLatestBlockhash()
            const escrowTx = new Transaction({
              recentBlockhash: blockhash,
              feePayer: publicKey,
            }).add(createEscrowIx)
            const signedEscrowTx = await signTransaction(escrowTx)
            const escrowTxSig = await connection.sendRawTransaction(signedEscrowTx.serialize())
            console.log('Escrow token account created with signature:', escrowTxSig)
            await connection.confirmTransaction(escrowTxSig, 'confirmed')
          } else {
            console.log('Escrow token account already exists')
          }
          break
        } catch (err: any) {
          console.log(`Market not yet available, retrying... (${retries + 1}/${maxRetries})`, err?.message)
          console.log('Error type:', err?.name)
          console.log('Error details:', err)
          
          retries++
          if (retries < maxRetries) {
            const delay = Math.min(1000 * retries, 3000)
            await new Promise(resolve => setTimeout(resolve, delay))
          } else {
            console.error('Failed to verify market account after all retries')
            console.log('Transaction signature:', tx)
            console.log('Original requested PDA:', marketPda.toBase58())
            console.log('User Markets Counter PDA:', userMarketsCounterPda.toBase58())
            console.log('Original requested Market Index:', marketIndex)
            if (finalMarketPda) {
              console.log('Final market PDA to try:', finalMarketPda.toBase58())
            }
            
            const errorMsg = `Market account not available after multiple attempts. The transaction succeeded but we cannot verify the account. This is likely a version mismatch between the deployed program and the frontend. Transaction: ${tx}`
            console.error(errorMsg)
            throw new Error(errorMsg)
          }
        }
      }
      
      setStatusMessage('Redirecting to market...')
      await new Promise(resolve => setTimeout(resolve, 500))
      if (finalMarketPda) {
        router.navigate({ to: '/markets/$id', params: { id: finalMarketPda.toBase58() } })
      } else {
        router.navigate({ to: '/markets' })
      }
    } catch (err) {
      console.error('Error creating market:', err)
      setError(parseError(err))
    } finally {
      setLoading(false)
      setVerifyingMarket(false)
      setStatusMessage('')
    }
  }

  if (verifyingMarket) {
    return (
      <div className="create-market-page">
        <div className="page-header">
          <h1>Create Market</h1>
        </div>
        <div className="verification-container">
          <div className="loading-spinner"></div>
          <p>{statusMessage}</p>
          <p className="verification-note">This may take a few moments while the network confirms your transaction.</p>
        </div>
      </div>
    )
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
            <label>Market Type</label>
            <div className="market-type-selector">
              <button
                type="button"
                className={`type-option-card ${marketType === 'binary' ? 'active' : ''}`}
                onClick={() => {
                  setMarketType('binary')
                  setOptions(options.slice(0, 2))
                }}
                disabled={loading}
              >
                Binary (2 Options)
              </button>
              <button
                type="button"
                className={`type-option-card ${marketType === 'multi' ? 'active' : ''}`}
                onClick={() => {
                  setMarketType('multi')
                }}
                disabled={loading}
              >
                Multi-Option (2-16 Options)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="question">Question</label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={handleQuestionChange}
              placeholder="Who will win the most 2026 AMAF awards?"
              maxLength={200}
              disabled={loading}
            />
            <span className="char-count">{question.length}/200</span>
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

          <div className="form-group">
            <label>
              Options ({options.length}/16)
            </label>
            {marketType === 'binary' ? (
              <div className="binary-options">
                <input
                  type="text"
                  className="option-input"
                  value={options[0] || ''}
                  onChange={(e) => {
                    const newOptions = [...options]
                    newOptions[0] = e.target.value
                    setOptions(newOptions)
                  }}
                  placeholder="Option 1"
                  maxLength={50}
                  disabled={loading}
                />
                <input
                  type="text"
                  className="option-input"
                  value={options[1] || ''}
                  onChange={(e) => {
                    const newOptions = [...options]
                    newOptions[1] = e.target.value
                    setOptions(newOptions)
                  }}
                  placeholder="Option 2"
                  maxLength={50}
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="multi-options">
                {options.map((opt, idx) => (
                  <div key={idx} className="option-row">
                    <span>{idx + 1}.</span>
                    <input
                      type="text"
                      className="option-input"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[idx] = e.target.value
                        setOptions(newOptions)
                      }}
                      placeholder={`Option ${idx + 1}`}
                      maxLength={50}
                      disabled={loading}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        className="remove-option"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 16 && (
                  <div className="add-option">
                    <input
                      type="text"
                      className="option-input"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Option name"
                      maxLength={50}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={handleAddOption}
                      disabled={loading || !newOption.trim()}
                    >
                      Add Option
                    </button>
                  </div>
                )}
              </div>
            )}
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
              {lastTxSignature && (
                <div className="error-actions">
                  <a
                    href={`https://explorer.solana.com/tx/${lastTxSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    View Transaction on Explorer
                  </a>
                  <Link to="/markets" className="link-button">
                    Go to Markets List
                  </Link>
                </div>
              )}
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
