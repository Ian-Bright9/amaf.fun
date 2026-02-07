import { createFileRoute } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { getMarkets, type Market, MarketType } from '@/data/markets'
import { getOptionPrices, formatPrice } from '@/lib/pricing'
import { useConnection } from '@/lib/useConnection'

import './index.css'

export const Route = createFileRoute('/markets/')({ component: MarketsPage })

function MarketsPage() {
  const { publicKey, connected } = useWallet()
  const connection = useConnection()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMarkets(retries = 0) {
      if (!connected) {
        setLoading(false)
        return
      }
      try {
        console.log('Fetching markets, attempt', retries + 1)
        const wallet = { publicKey, signTransaction: () => null, signAllTransactions: () => null }
        const fetchedMarkets = await getMarkets(connection, wallet)
        console.log('Fetched', fetchedMarkets.length, 'markets')
        setMarkets(fetchedMarkets)
        setFetchError(null)
      } catch (error) {
        console.error('Error fetching markets:', error)
        if (retries < 10) {
          console.log(`Retrying... (${retries + 1}/10)`)
          setTimeout(() => fetchMarkets(retries + 1), 1000 * Math.min(retries + 1, 3))
        } else {
          setFetchError('Failed to load markets after multiple attempts. This could be a temporary network issue. Please try refreshing the page.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchMarkets()
  }, [connected, publicKey])

  if (loading) {
    return (
      <div className="markets-page">
        <div className="loading">Loading markets...</div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="markets-page">
        <div className="connect-prompt">
          <p>Please connect your wallet to view markets</p>
        </div>
      </div>
    )
  }

  return (
    <div className="markets-page">
      <div className="page-header">
        <h1>Markets</h1>
        <Link to="/markets/create" className="button button-primary">
          Create Market
        </Link>
      </div>

      {fetchError && (
        <div className="error-message">
          <p>{fetchError}</p>
          <button onClick={() => window.location.reload()} className="button button-secondary">
            Try Again
          </button>
        </div>
      )}

      {markets.length === 0 && !fetchError ? (
        <div className="empty-state">
          <p>No markets found. Create one to get started!</p>
        </div>
      ) : (
        <div className="markets-grid">
          {markets.map((market) => {
            try {
              const optionPrices = getOptionPrices(market.options)
              return (
                <Link
                  key={market.publicKey.toBase58()}
                  to="/markets/$id"
                  params={{ id: market.publicKey.toBase58() }}
                  className="market-card"
                >
                  <div className="market-header">
                    <span className={`market-type ${market.marketType === MarketType.Binary ? 'binary' : 'multi'}`}>
                      {market.marketType === MarketType.Binary ? 'Binary' : `${market.numOptions} Options`}
                    </span>
                    <span className={`status-badge ${market.resolved ? 'status-resolved' : 'status-active'}`}>
                      {market.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                  <h3 className="market-question">{market.question}</h3>
                  <p className="market-description">{market.description}</p>
                  <div className="options-preview">
                    {market.marketType === MarketType.Binary ? (
                      <div className="binary-preview">
                        <span>YES: {formatPrice(optionPrices[0])}</span>
                        <span>NO: {formatPrice(optionPrices[1])}</span>
                      </div>
                    ) : (
                      <div className="multi-preview">
                        {market.options.slice(0, 3).map((opt, idx) => (
                          <span key={idx}>{opt.name}: {formatPrice(optionPrices[idx])}</span>
                        ))}
                        {market.numOptions > 3 && <span>+{market.numOptions - 3} more</span>}
                      </div>
                    )}
                  </div>
                  <div className="market-stats">
                    <span className="stat">Total Options: {market.numOptions}</span>
                    <span className="stat">Collateral: {formatNumber(market.collateralBalance)} AMAF</span>
                  </div>
                </Link>
              )
            } catch (err) {
              console.error('Error rendering market card:', market.publicKey.toBase58(), err)
              return (
                <div key={market.publicKey.toBase58()} className="market-card error">
                  <p>Error rendering market: {market.question}</p>
                </div>
              )
            }
          })}
        </div>
      )}
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
