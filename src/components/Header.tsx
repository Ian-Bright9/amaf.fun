import { Link } from '@tanstack/react-router'

import { WalletConnectButton } from './WalletConnectButton'
import { ClientOnly } from './ClientOnly'

import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <nav className="nav">
        <div className="nav-item">
          <Link to="/">AMAF</Link>
        </div>

        <div className="nav-item">
          <Link to="/markets">Markets</Link>
        </div>

        <div className="nav-item">
          <Link to="/markets/create">Create Market</Link>
        </div>

        <div className="nav-item">
          <ClientOnly>
            <WalletConnectButton />
          </ClientOnly>
        </div>
      </nav>
    </header>
  )
}
