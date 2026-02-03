import { createFileRoute } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
<<<<<<< HEAD
import { Link } from '@tanstack/react-router'

import { getMarkets, type Market } from '@/data/markets'
import { useConnection } from '@/lib/useConnection'
=======
import { Connection, clusterApiUrl } from '@solana/web3.js'
import { Link } from '@tanstack/react-router'

import { getMarkets, type Market } from '@/data/markets'
>>>>>>> main

import './index.css'

export const Route = createFileRoute('/markets/')({ component: MarketsPage })

function MarketsPage() {
  const { publicKey, connected } = useWallet()
<<<<<<< HEAD
  const connection = useConnection()
=======
>>>>>>> main
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMarkets() {
      if (!connected) {
        setLoading(false)
        return
      }
      try {
<<<<<<< HEAD
=======
        const connection = new Connection(clusterApiUrl('devnet'))
>>>>>>> main
        const wallet = { publicKey, signTransaction: () => null, signAllTransactions: () => null }
        const fetchedMarkets = await getMarkets(connection, wallet)
        setMarkets(fetchedMarkets)
      } catch (error) {
        console.error('Error fetching markets:', error)
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

      {markets.length === 0 ? (
        <div className="empty-state">
          <p>No markets found. Create one to get started!</p>
        </div>
      ) : (
        <div className="markets-grid">
          {markets.map((market) => (
            <Link
              key={market.publicKey.toBase58()}
              to="/markets/$id"
              params={{ id: market.publicKey.toBase58() }}
              className="market-card"
            >
              <div className="market-status">
                {market.resolved ? (
                  <span className="status-badge status-resolved">
                    Resolved - {market.outcome ? 'YES' : 'NO'}
                  </span>
                ) : (
                  <span className="status-badge status-active">Active</span>
                )}
              </div>
              <h3 className="market-question">{market.question}</h3>
              <p className="market-description">{market.description}</p>
              <div className="market-pools">
                <div className="pool">
                  <span className="pool-label">YES</span>
                  <span className="pool-value">
                    {formatNumber(market.totalYes)}
                  </span>
                </div>
                <div className="pool">
                  <span className="pool-label">NO</span>
                  <span className="pool-value">
                    {formatNumber(market.totalNo)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
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
