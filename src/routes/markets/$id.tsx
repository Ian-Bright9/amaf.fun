import { createFileRoute } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { SystemProgram, PublicKey, Transaction } from '@solana/web3.js'
import { Link } from '@tanstack/react-router'

import { getProgram, type Market, MarketType, Outcome } from '@/data/markets'
import {
  getMintPDA,
  getOrCreateUserTokenAccount,
  getEscrowTokenAccount,
  getBetPDA
} from '@/data/tokens'
import { getOptionPrices, calculateBuyCost, calculatePotentialPayout, formatPrice, calculateSellPayout } from '@/lib/pricing'
import { useConnection } from '@/lib/useConnection'
import { ResolveModal } from '@/components/ResolveModal'

import './$id.css'

export const Route = createFileRoute('/markets/$id')({ component: MarketDetailPage })

function MarketDetailPage() {
  const { id } = Route.useParams()
  const { publicKey, connected, signTransaction } = useWallet()
  const connection = useConnection()
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharesAmount, setSharesAmount] = useState('')
  const [selectedOption, setSelectedOption] = useState<number>(0)
  const [buying, setBuying] = useState(false)
  const [selling, setSelling] = useState(false)
  const [error, setError] = useState('')
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy')
  const [userBet, setUserBet] = useState<any>(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState<number>(0)
  const [newOptionName, setNewOptionName] = useState('')
  const [canceling, setCanceling] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [addingOption, setAddingOption] = useState(false)

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

        if (publicKey) {
          try {
            const [betPda] = getBetPDA(new PublicKey(id), publicKey)
            const betAccountInfo = await connection.getAccountInfo(betPda)
            if (betAccountInfo) {
              const betAccount = await (program.account as any).bet.fetch(betPda)
              setUserBet({
                publicKey: betPda,
                market: betAccount.market,
                user: betAccount.user,
                shares: BigInt(betAccount.shares.toString()),
                optionIndex: betAccount.optionIndex as number,
                claimed: betAccount.claimed as boolean,
              })
            } else {
              setUserBet(null)
            }
          } catch (err) {
            console.error('Error fetching bet:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching market:', err)
        if (retries < 10) {
          console.log(`Retrying... (${retries + 1}/10)`)
          setTimeout(() => fetchMarket(retries + 1), 1000 * Math.min(retries + 1, 3))
        } else {
          setError(`Failed to load market after multiple attempts. This could be a network issue or the market address ${id} may not exist. Please check your connection and try again.`)
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
  const costPreview = sharesAmount && market
    ? calculateBuyCost(BigInt(Math.floor(parseFloat(sharesAmount) || 0)), market.options, market.collateralBalance, selectedOption)
    : null
  const sellPayoutPreview = sharesAmount && market && userBet && tradeMode === 'sell'
    ? calculateSellPayout(BigInt(Math.floor(parseFloat(sharesAmount) || 0)), market.options, market.collateralBalance, userBet.optionIndex)
    : null

  async function handleBuyShares(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!connected || !publicKey) {
      setError('Please connect your wallet')
      return
    }

    const shares = Math.floor(parseFloat(sharesAmount) || 0)
    if (isNaN(shares) || shares <= 0) {
      setError('Please enter a valid number of shares')
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

      const userTokenResult = await getOrCreateUserTokenAccount(
        publicKey,
        mintAddress,
        connection,
        publicKey
      )

      let tx: string
      if (userTokenResult.instruction) {
        const buySharesIx = await program.methods
          .buyShares(shares, selectedOption)
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
          .buyShares(shares, selectedOption)
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
      setSharesAmount('')
    } catch (err) {
      console.error('Error buying shares:', err)
      setError('Failed to buy shares. Please try again.')
    } finally {
      setBuying(false)
    }
  }

  async function handleSellShares(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!connected || !publicKey) {
      setError('Please connect your wallet')
      return
    }

    if (!userBet) {
      setError('You have no shares in this market')
      return
    }

    const shares = Math.floor(parseFloat(sharesAmount) || 0)
    if (isNaN(shares) || shares <= 0) {
      setError('Please enter a valid number of shares')
      return
    }

    if (shares > Number(userBet.shares)) {
      setError('You do not have enough shares')
      return
    }

    setSelling(true)
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
      const userTokenResult = await getOrCreateUserTokenAccount(publicKey, mintAddress, connection, publicKey)

      let tx: string
      const sellSharesIx = await program.methods
        .sellShares(shares)
        .accounts({
          market: marketPublicKey,
          bet: betPda,
          userToken: userTokenResult.address,
          escrowToken: escrowTokenAddress,
          user: publicKey,
          mint: mintAddress,
          tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          systemProgram: SystemProgram.programId,
        })
        .instruction()

      const { blockhash } = await connection.getLatestBlockhash()
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(sellSharesIx)

      const signedTx = await signTransaction!(transaction)
      tx = await connection.sendRawTransaction(signedTx.serialize())

      console.log('Shares sold with signature:', tx)
      setSharesAmount('')
    } catch (err) {
      console.error('Error selling shares:', err)
      setError('Failed to sell shares. Please try again.')
    } finally {
      setSelling(false)
    }
  }

  async function handleResolveMarket() {
    if (!connected || !publicKey) {
      setError('Please connect your wallet')
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
      setError('Failed to resolve market. Please try again.')
    } finally {
      setResolving(false)
    }
  }

  async function handleCancelMarket() {
    if (!connected || !publicKey) {
      setError('Please connect your wallet')
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
      setError('Failed to cancel market. Please try again.')
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
      setError('Failed to add option. Please try again.')
    } finally {
      setAddingOption(false)
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
            <div className="trade-tabs">
              <button
                className={`trade-tab ${tradeMode === 'buy' ? 'active' : ''}`}
                onClick={() => setTradeMode('buy')}
              >
                Buy
              </button>
              <button
                className={`trade-tab ${tradeMode === 'sell' ? 'active' : ''}`}
                onClick={() => setTradeMode('sell')}
                disabled={!userBet}
              >
                Sell {userBet && `(${formatNumber(userBet.shares)} shares)`}
              </button>
            </div>

            {tradeMode === 'buy' ? (
              <form onSubmit={handleBuyShares} className="trade-form">
                <div className="form-group">
                  <label>Number of Shares</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={sharesAmount}
                    onChange={(e) => setSharesAmount(e.target.value)}
                    placeholder="10"
                    disabled={buying}
                  />
                </div>

                {costPreview && (
                  <div className="cost-preview">
                    <p>Cost: {formatNumber(costPreview.costTokens)} AMAF</p>
                    <p>Potential Payout: {calculatePotentialPayout(BigInt(Math.floor(parseFloat(sharesAmount) || 0))).toFixed(2)} AMAF</p>
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="button button-primary" disabled={buying}>
                  {buying ? 'Buying Shares...' : `Buy Shares of ${market.options[selectedOption]?.name}`}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSellShares} className="trade-form">
                <div className="form-group">
                  <label>Number of Shares to Sell</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={sharesAmount}
                    onChange={(e) => setSharesAmount(e.target.value)}
                    placeholder={userBet ? Math.floor(Number(userBet.shares)).toString() : '0'}
                    disabled={selling}
                    max={userBet ? Math.floor(Number(userBet.shares)).toString() : undefined}
                  />
                  {userBet && (
                    <p className="max-shares-info">
                      You own: {formatNumber(userBet.shares)} shares
                    </p>
                  )}
                </div>

                {sellPayoutPreview && (
                  <div className="cost-preview">
                    <p>You will receive: {formatNumber(sellPayoutPreview.payoutTokens)} AMAF</p>
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="button button-primary" disabled={selling}>
                  {selling ? 'Selling Shares...' : 'Sell Shares'}
                </button>
              </form>
            )}

            {market.authority.equals(publicKey!) && (
              <div className="authority-controls">
                <h3>Authority Controls</h3>

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
