import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

import { DailyAmafClaim } from '@/components/DailyAmafClaim'

import './index.css'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="home-page">
      <div className="hero">
        <h1 className="hero-title">AMAF Prediction Markets</h1>
        <p className="hero-subtitle">
          Decentralized prediction markets on Solana
        </p>
        <div className="hero-actions">
          <Link to="/markets" className="button button-primary">
            Browse Markets
          </Link>
          <Link to="/markets/create" className="button button-secondary">
            Create Market
          </Link>
        </div>
      </div>

      <div className="home-content">
        <DailyAmafClaim />

        <div className="features">
          <div className="feature-card">
            <h2>Decentralized</h2>
            <p>Built on Solana blockchain for fast, low-cost transactions</p>
          </div>
          <div className="feature-card">
            <h2>Transparent</h2>
            <p>All market data and outcomes are on-chain and verifiable</p>
          </div>
          <div className="feature-card">
            <h2>Secure</h2>
            <p>Smart contracts ensure fair resolution and instant payouts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
