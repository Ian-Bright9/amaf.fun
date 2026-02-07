import { createFileRoute } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { SystemProgram, PublicKey, Transaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { Link } from '@tanstack/react-router'

import { getProgram, type Market, MarketType, Outcome } from '@/data/markets'
import {
  getMintPDA,
  getOrCreateUserTokenAccount,
  getEscrowTokenAccount,
  getBetPDA
} from '@/data/tokens'
import { getOptionPrices, calculateBuyCost, calculatePotentialPayout, calculateSharesFromTokens, formatPrice } from '@/lib/pricing'
import { useConnection } from '@/lib/useConnection'
import { ResolveModal } from '@/components/ResolveModal'
import { parseError, type ParsedError } from '@/lib/errors'

import './$id.css'

export const Route = createFileRoute('/markets/$id')({ component: MarketDetailPage })

function MarketDetailPage() {
  const { id } = Route.useParams()
  const { publicKey, connected, signTransaction } = useWallet()
  const connection = useConnection()
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [amafAmount, setAmafAmount] = useState<string>('0')
  const [selectedOption, setSelectedOption] = useState<number>(0)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<ParsedError | null>(null)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [userBalance, setUserBalance] = useState<bigint>(0n)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState<number>(0)
  const [newOptionName, setNewOptionName] = useState('')
  const [canceling, setCanceling] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [addingOption, setAddingOption] = useState(false)
  const [initializingEscrow, setInitializingEscrow] = useState(false)
  const [escrowExists, setEscrowExists] = useState(true)

  useEffect(() => {
    async function fetchMarket(retries = 0) {
      if (!connected) {
        setLoading(false)
        return
      }
      try {
        const wallet = { publicKey, signTransaction: () => null, signAllTransactions: () => null }
        const program = await getProgram(connection, wallet)
        const marketAccount = await (program.account as any).market.fetch(new PublicKey(id))
        setMarket({
          publicKey: new PublicKey(id),
          authority: marketAccount.authority,
          marketIndex: marketAccount.marketIndex,
          bump: marketAccount.bump,
          marketType: marketAccount.marketType,
          question: marketAccount.question,
          description: marketAccount.description,
          resolved: marketAccount.resolved,
          outcome: marketAccount.outcome,
          options: (marketAccount.options as any[]).map((opt: any) => ({
            shares: BigInt(opt.shares.toString()),
            name: opt.name as string,
            active: opt.active as boolean,
          })),
          numOptions: marketAccount.numOptions,
          collateralBalance: BigInt(marketAccount.collateralBalance.toString()),
          virtualLiquidity: BigInt(marketAccount.virtualLiquidity.toString()),
        })

        const [mintAddress] = getMintPDA()
        const escrowTokenAddress = getEscrowTokenAccount(new PublicKey(id), mintAddress)
        const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAddress)
        setEscrowExists(escrowAccountInfo !== null)

        if (publicKey) {
          try {
            const userTokenResult = await getOrCreateUserTokenAccount(publicKey, mintAddress, connection, publicKey)
            const balance = await connection.getTokenAccountBalance(userTokenResult.address)
            setUserBalance(BigInt(balance.value.amount))
          } catch (err) {
            console.error('Error fetching user balance:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching market:', err)
        if (retries < 10) {
          console.log(`Retrying... (${retries + 1}/10)`)
          setTimeout(() => fetchMarket(retries + 1), 1000 * Math.min(retries + 1, 3))
        } else {
          setError({ userMessage: `Failed to load market after multiple attempts. This could be a network issue or the market address ${id} may not exist. Please check your connection and try again.`, technicalDetails: null, errorCode: null })
        }
      } finally {
        if (!market) {
          setLoading(false)
        }
      }
    }
    fetchMarket()
  }, [id, connected, publicKey, connection])

  const optionPrices = market ? getOptionPrices(market.options) : []
  const shares = amafAmount && market
    ? calculateSharesFromTokens(BigInt(Math.floor(parseFloat(amafAmount) * 10)), market.options, market.collateralBalance)
    : 0n
  const costPreview = amafAmount && market && shares > 0n
    ? calculateBuyCost(shares, market.options, market.collateralBalance, selectedOption)
    : null

  const userBalanceAMAF = userBalance > 0n ? Number(userBalance / 1000000000n) : 0
  const maxSliderValue = Math.max(10, Math.floor(userBalanceAMAF))

  useEffect(() => {
    if (userBalanceAMAF > 0) {
      const currentAmount = parseFloat(amafAmount)
      if (currentAmount > maxSliderValue) {
        setAmafAmount(maxSliderValue.toString())
      }
    }
  }, [userBalanceAMAF, maxSliderValue, amafAmount])

  async function handleBuyShares(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!connected || !publicKey) {
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    const amaflAmount = parseFloat(amafAmount)
    if (isNaN(amaflAmount) || amaflAmount <= 0) {
      setError({ userMessage: 'Please enter a valid AMAF amount', technicalDetails: null, errorCode: null })
      return
    }

    setBuying(true)
    try {
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      const [betPda] = getBetPDA(new PublicKey(id), publicKey)
      const [mintAddress] = getMintPDA()
      const marketPublicKey = new PublicKey(id)
      const escrowTokenAddress = getEscrowTokenAccount(marketPublicKey, mintAddress)

      const escrowTokenAccountInfo = await connection.getAccountInfo(escrowTokenAddress)
      if (!escrowTokenAccountInfo) {
        const isAuthority = publicKey && market && market.authority.equals(publicKey)
        setError({
          userMessage: isAuthority
            ? 'This market cannot be traded yet. Please initialize the escrow account using the button in Authority Controls.'
            : 'This market cannot be traded yet. Please ask the market authority to initialize the escrow account.',
          technicalDetails: 'The escrow token account does not exist. New markets created after this fix include escrow initialization.',
          errorCode: 'ESCROW_NOT_INITIALIZED'
        })
        return
      }

      const userTokenResult = await getOrCreateUserTokenAccount(
        publicKey,
        mintAddress,
        connection,
        publicKey
      )

      let tx: string
      if (userTokenResult.instruction) {
        const buySharesIx = await program.methods
          .buyShares(Number(shares), selectedOption)
          .accounts({
            market: marketPublicKey,
            bet: betPda,
            userToken: userTokenResult.address,
            escrowToken: escrowTokenAddress,
            user: publicKey,
            mint: mintAddress,
            tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
            systemProgram: SystemProgram.programId,
          })
          .instruction()

        const { blockhash } = await connection.getLatestBlockhash()
        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: publicKey,
        }).add(userTokenResult.instruction, buySharesIx)
        const signedTx = await signTransaction!(transaction)
        tx = await connection.sendRawTransaction(signedTx.serialize())
      } else {
        tx = await program.methods
          .buyShares(Number(shares), selectedOption)
          .accounts({
            market: marketPublicKey,
            bet: betPda,
            userToken: userTokenResult.address,
            escrowToken: escrowTokenAddress,
            user: publicKey,
            mint: mintAddress,
            tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            associatedTokenProgram: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
            systemProgram: SystemProgram.programId,
          })
          .rpc()
      }

      console.log('Shares bought with signature:', tx)
      setAmafAmount('0')
    } catch (err) {
      console.error('Error buying shares:', err)
      setError(parseError(err))
    } finally {
      setBuying(false)
    }
  }

  async function handleResolveMarket() {
    if (!connected || !publicKey) {
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    setResolving(true)
    try {
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      const tx = await program.methods
        .resolveMarket(winnerIndex)
        .accounts({
          market: new PublicKey(id),
          authority: publicKey,
        })
        .rpc()

      console.log('Market resolved with signature:', tx)
      window.location.reload()
    } catch (err) {
      console.error('Error resolving market:', err)
      setError(parseError(err))
    } finally {
      setResolving(false)
    }
  }

  async function handleCancelMarket() {
    if (!connected || !publicKey) {
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    setCanceling(true)
    try {
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      const tx = await program.methods
        .cancelMarket()
        .accounts({
          market: new PublicKey(id),
          authority: publicKey,
        })
        .rpc()

      console.log('Market cancelled with signature:', tx)
      window.location.reload()
    } catch (err) {
      console.error('Error cancelling market:', err)
      setError(parseError(err))
    } finally {
      setCanceling(false)
    }
  }

  async function handleAddOption(e: React.FormEvent) {
    e.preventDefault()
    if (!newOptionName.trim() || !publicKey) return

    setAddingOption(true)
    try {
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      await program.methods
        .addOption(newOptionName.trim())
        .accounts({
          market: new PublicKey(id),
          authority: publicKey!,
        })
        .rpc()

      setNewOptionName('')
      window.location.reload()
    } catch (err) {
      console.error('Error adding option:', err)
      setError(parseError(err))
    } finally {
      setAddingOption(false)
    }
  }

  async function handleInitializeEscrow() {
    if (!connected || !publicKey || !signTransaction) {
      setError({ userMessage: 'Please connect your wallet', technicalDetails: null, errorCode: null })
      return
    }

    setInitializingEscrow(true)
    try {
      const [mintAddress] = getMintPDA()
      const marketPublicKey = new PublicKey(id)
      const escrowTokenAddress = getEscrowTokenAccount(marketPublicKey, mintAddress)

      const createEscrowIx = createAssociatedTokenAccountInstruction(
        publicKey,
        escrowTokenAddress,
        marketPublicKey,
        mintAddress
      )

      const { blockhash } = await connection.getLatestBlockhash()
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(createEscrowIx)

      const signedTx = await signTransaction(transaction)
      const tx = await connection.sendRawTransaction(signedTx.serialize())

      console.log('Escrow token account initialized with signature:', tx)
      await connection.confirmTransaction(tx, 'confirmed')
      setEscrowExists(true)
    } catch (err) {
      console.error('Error initializing escrow:', err)
      setError(parseError(err))
    } finally {
      setInitializingEscrow(false)
    }
  }

  if (loading) {
    return (
      <div className="market-detail-page">
        <div className="loading">Loading market...</div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="market-detail-page">
        <div className="error-message">
          <p>Market not found</p>
          <Link to="/markets" className="button button-primary">
            Back to Markets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="market-detail-page">
      <div className="page-header">
        <div>
          <Link to="/markets" className="back-link">
            ← Back to Markets
          </Link>
          <h1>{market.question}</h1>
        </div>
        <div className="market-status">
          <span className={`status-badge ${market.resolved ? 'status-resolved' : 'status-active'}`}>
            {market.resolved ? 'Resolved' : 'Active'}
          </span>
          <span className="market-type-badge">
            {market.marketType === MarketType.Binary ? 'Binary' : `${market.numOptions} Options`}
          </span>
        </div>
      </div>

      <div className="market-content">
        <div className="market-info">
          <p className="description">{market.description}</p>

          <div className="options-grid">
            {market.options.map((option, idx) => (
              <div
                key={idx}
                className={`option-card ${selectedOption === idx ? 'selected' : ''}`}
                onClick={() => !market.resolved && setSelectedOption(idx)}
              >
                <h3>{option.name}</h3>
                <div className="option-price">
                  {formatPrice(optionPrices[idx])}
                </div>
                <div className="option-shares">
                  {formatNumber(option.shares)} shares
                </div>
                {!option.active && <span className="inactive-badge">Inactive</span>}
              </div>
            ))}
          </div>
        </div>

          {market.resolved ? (
            <div className="market-resolved">
              <p>This market has been resolved.</p>
              {market.outcome === Outcome.Cancelled && (
                <p className="cancelled">Market Cancelled</p>
              )}
            </div>
          ) : (
          <div className="trading-section">
            <form onSubmit={handleBuyShares} className="trade-form">
              <div className="form-group">
                <label>Select Option to Buy</label>
                <select
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(Number(e.target.value))}
                  disabled={buying}
                  className="option-select"
                >
                  {market.options.map((option, idx) => (
                    <option key={idx} value={idx} disabled={!option.active || market.resolved}>
                      {option.name} - {formatPrice(optionPrices[idx])}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount to Buy (AMAF)</label>
                <input
                  type="range"
                  min="10"
                  max={maxSliderValue}
                  step="10"
                  value={amafAmount}
                  onChange={(e) => setAmafAmount(e.target.value)}
                  disabled={buying || userBalanceAMAF < 10}
                  className="amaf-slider"
                />
                <div className="slider-value">
                  <span>{parseFloat(amafAmount).toFixed(2)} AMAF</span>
                </div>
                <div className="quick-select">
                  <button
                    type="button"
                    className={`quick-select-button ${amafAmount === '10' ? 'active' : ''}`}
                    onClick={() => setAmafAmount('10')}
                    disabled={buying || userBalanceAMAF < 10}
                  >
                    10
                  </button>
                  <button
                    type="button"
                    className={`quick-select-button ${amafAmount === '50' ? 'active' : ''}`}
                    onClick={() => setAmafAmount('50')}
                    disabled={buying || userBalanceAMAF < 50}
                  >
                    50
                  </button>
                  <button
                    type="button"
                    className={`quick-select-button ${amafAmount === '100' ? 'active' : ''}`}
                    onClick={() => setAmafAmount('100')}
                    disabled={buying || userBalanceAMAF < 100}
                  >
                    100
                  </button>
                  <button
                    type="button"
                    className={`quick-select-button ${amafAmount === '250' ? 'active' : ''}`}
                    onClick={() => setAmafAmount('250')}
                    disabled={buying || userBalanceAMAF < 250}
                  >
                    250
                  </button>
                  <button
                    type="button"
                    className={`quick-select-button ${amafAmount === '500' ? 'active' : ''}`}
                    onClick={() => setAmafAmount('500')}
                    disabled={buying || userBalanceAMAF < 500}
                  >
                    500
                  </button>
                </div>
              </div>

              {costPreview && (
                <div className="cost-preview">
                  <p>Cost: {formatNumber(costPreview.costTokens)} AMAF</p>
                  <p>Potential Payout: {calculatePotentialPayout(shares).toFixed(2)} AMAF</p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <div className="error-content">
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
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      type="button"
                    >
                      {showErrorDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                    </button>
                  )}
                  {showErrorDetails && error.technicalDetails && (
                    <div className="error-technical">
                      <pre>{error.technicalDetails}</pre>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="button button-primary" disabled={buying || parseFloat(amafAmount) <= 0 || parseFloat(amafAmount) > userBalanceAMAF}>
                {buying ? 'Buying...' : `Buy ${parseFloat(amafAmount).toFixed(2)} AMAF worth of ${market.options[selectedOption]?.name}`}
              </button>
            </form>

            {market.authority.equals(publicKey!) && (
              <div className="authority-controls">
                <h3>Authority Controls</h3>

                {!escrowExists && (
                  <div className="authority-actions">
                    <button
                      className="button button-primary"
                      onClick={handleInitializeEscrow}
                      disabled={initializingEscrow}
                    >
                      {initializingEscrow ? 'Initializing...' : 'Initialize Escrow Account'}
                    </button>
                  </div>
                )}

                <div className="authority-actions">
                  <button
                    className="button button-cancel"
                    onClick={handleCancelMarket}
                    disabled={canceling}
                  >
                    {canceling ? 'Canceling...' : 'Cancel Market'}
                  </button>
                  <button
                    className="button button-resolve"
                    onClick={() => setShowResolveModal(true)}
                    disabled={resolving}
                  >
                    Resolve Market
                  </button>
                </div>

                {market.marketType === MarketType.MultiOption && market.numOptions < 16 && (
                  <div className="add-option-section">
                    <h4>Add Option</h4>
                    <form onSubmit={handleAddOption}>
                      <input
                        type="text"
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        placeholder="Option name"
                        maxLength={50}
                        disabled={addingOption}
                      />
                      <button
                        type="submit"
                        className="button button-secondary"
                        disabled={addingOption || !newOptionName.trim()}
                      >
                        {addingOption ? 'Adding...' : 'Add'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ResolveModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        market={market}
        onResolve={async (winnerIndex) => {
          setWinnerIndex(winnerIndex)
          await handleResolveMarket()
        }}
        resolving={resolving}
      />
    </div>
  )
}

function formatBigInt(value: bigint, decimals: number = 6): string {
  const isNegative = value < 0n
  const absValue = isNegative ? -value : value
  
  const str = absValue.toString()
  const padding = Math.max(0, decimals - str.length) + 1
  const padded = '0'.repeat(padding) + str
  
  const integerPart = padded.slice(0, -decimals) || '0'
  const fractionalPart = padded.slice(-decimals)
  
  const trimmedFractional = fractionalPart.replace(/0+$/, '')
  const result = trimmedFractional ? `${integerPart}.${trimmedFractional}` : integerPart
  
  return isNegative ? `-${result}` : result
}

function formatNumber(value: bigint): string {
  const num = parseFloat(formatBigInt(value, 6))
  if (num < 1000) {
    return num.toFixed(2)
  }
  if (num < 1000000) {
    return `${(num / 1000).toFixed(2)}K`
  }
  return `${(num / 1000000).toFixed(2)}M`
}
