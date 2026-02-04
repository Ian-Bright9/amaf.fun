import { createFileRoute } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { SystemProgram, PublicKey, Transaction } from '@solana/web3.js'
import { Link } from '@tanstack/react-router'

import { getProgram, type Market } from '@/data/markets'
import {
  getMintPDA,
  getOrCreateUserTokenAccount,
  getEscrowTokenAccount,
  getBetPDA
} from '@/data/tokens'
import { useConnection } from '@/lib/useConnection'

import './$id.css'

export const Route = createFileRoute('/markets/$id')({ component: MarketDetailPage })

function MarketDetailPage() {
  const { id } = Route.useParams()
  const { publicKey, connected, signTransaction } = useWallet()
  const connection = useConnection()
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [betAmount, setBetAmount] = useState('')
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes')
  const [betting, setBetting] = useState(false)
  const [error, setError] = useState('')

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
          question: marketAccount.question,
          description: marketAccount.description,
          resolved: marketAccount.resolved,
          outcome: marketAccount.outcome,
          totalYes: marketAccount.totalYes,
          totalNo: marketAccount.totalNo,
        })
      } catch (err) {
        console.error('Error fetching market:', err)
        if (retries < 5) {
          console.log(`Retrying... (${retries + 1}/5)`)
          setTimeout(() => fetchMarket(retries + 1), 1000 * (retries + 1))
        }
      } finally {
        if (!market) {
          setLoading(false)
        }
      }
    }
    fetchMarket()
  }, [id, connected, publicKey])

  async function handlePlaceBet(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!connected || !publicKey) {
      setError('Please connect your wallet')
      return
    }

    const amount = parseFloat(betAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bet amount')
      return
    }

    setBetting(true)
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
        const placeBetIx = await program.methods
          .placeBet(amount * 1000000, betSide === 'yes')
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
        }).add(userTokenResult.instruction, placeBetIx)
        const signedTx = await signTransaction!(transaction)
        tx = await connection.sendRawTransaction(signedTx.serialize())
      } else {
        tx = await program.methods
          .placeBet(amount * 1000000, betSide === 'yes')
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

      console.log('Bet placed with signature:', tx)
      setBetAmount('')
    } catch (err) {
      console.error('Error placing bet:', err)
      setError('Failed to place bet. Please try again.')
    } finally {
      setBetting(false)
    }
  }

  async function handleResolveMarket(outcome: boolean) {
    if (!connected || !publicKey) {
      setError('Please connect your wallet')
      return
    }

    try {
      const program = await getProgram(connection, {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any) => Promise.all(txs.map(signTransaction)),
      })

      const tx = await program.methods
        .resolveMarket(outcome)
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
          {market.resolved ? (
            <span className="status-badge status-resolved">
              Resolved - {market.outcome ? 'YES' : 'NO'}
            </span>
          ) : (
            <span className="status-badge status-active">Active</span>
          )}
        </div>
      </div>

      <div className="market-content">
        <div className="market-info">
          <p className="description">{market.description}</p>

          <div className="pools">
            <div className="pool pool-yes">
              <h3>YES Pool</h3>
              <div className="pool-value">¤{formatNumber(market.totalYes)}</div>
            </div>
            <div className="pool pool-no">
              <h3>NO Pool</h3>
              <div className="pool-value">¤{formatNumber(market.totalNo)}</div>
            </div>
          </div>
        </div>

        {market.resolved ? (
          <div className="market-resolved">
            <p>This market has been resolved.</p>
            {market.outcome ? (
              <p className="winner">WINNER: YES</p>
            ) : (
              <p className="winner">WINNER: NO</p>
            )}
          </div>
        ) : (
          <div className="bet-section">
            <h2>Place a Bet</h2>
            <form onSubmit={handlePlaceBet} className="bet-form">
              <div className="form-group">
                <label>Amount (AMAF)</label>
                <input
                  type="number"
                  step="0.01"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="1.0"
                  disabled={betting}
                />
              </div>

              <div className="form-group">
                <label>Side</label>
                <div className="bet-toggle">
                  <button
                    type="button"
                    className={`bet-side ${betSide === 'yes' ? 'active' : ''}`}
                    onClick={() => setBetSide('yes')}
                    disabled={betting}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    className={`bet-side ${betSide === 'no' ? 'active' : ''}`}
                    onClick={() => setBetSide('no')}
                    disabled={betting}
                  >
                    NO
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="button button-primary" disabled={betting}>
                {betting ? 'Placing Bet...' : 'Place Bet'}
              </button>
            </form>

            {market.authority.equals(publicKey!) && (
              <div className="authority-controls">
                <h3>Authority Controls</h3>
                <p>Resolve market as:</p>
                <div className="resolve-buttons">
                  <button
                    className="button button-yes"
                    onClick={() => handleResolveMarket(true)}
                  >
                    YES Wins
                  </button>
                  <button
                    className="button button-no"
                    onClick={() => handleResolveMarket(false)}
                  >
                    NO Wins
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatNumber(value: bigint): string {
  const num = Number(value) / 1000000
  if (num < 1000) {
    return num.toFixed(2)
  }
  if (num < 1000000) {
    return `${(num / 1000).toFixed(2)}K`
  }
  return `${(num / 1000000).toFixed(2)}M`
}
