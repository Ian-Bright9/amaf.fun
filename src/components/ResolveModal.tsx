import { Market, MarketType } from '@/data/markets'
import { useState } from 'react'
import './ResolveModal.css'

interface ResolveModalProps {
  isOpen: boolean
  onClose: () => void
  market: Market
  onResolve: (winnerIndex: number) => Promise<void>
  resolving: boolean
}

export function ResolveModal({ isOpen, onClose, market, onResolve, resolving }: ResolveModalProps) {
  const [winnerIndex, setWinnerIndex] = useState<number>(0)

  if (!isOpen) return null

  async function handleResolve() {
    await onResolve(winnerIndex)
  }

  return (
    <div className="resolve-modal-overlay" onClick={onClose}>
      <div className="resolve-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resolve-modal-header">
          <h2>Resolve Market</h2>
          <button className="resolve-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="resolve-modal-content">
          <p className="resolve-modal-question">{market.question}</p>

          <div className="resolve-options">
            {market.marketType === MarketType.Binary ? (
              <>
                <button
                  className="resolve-option-button resolve-yes"
                  onClick={() => { setWinnerIndex(0); handleResolve() }}
                  disabled={resolving}
                >
                  {resolving ? 'Resolving...' : 'YES Wins'}
                </button>
                <button
                  className="resolve-option-button resolve-no"
                  onClick={() => { setWinnerIndex(1); handleResolve() }}
                  disabled={resolving}
                >
                  {resolving ? 'Resolving...' : 'NO Wins'}
                </button>
              </>
            ) : (
              <>
                <label>Select Winning Option:</label>
                <select
                  value={winnerIndex}
                  onChange={(e) => setWinnerIndex(parseInt(e.target.value))}
                  disabled={resolving}
                  className="resolve-select"
                >
                  {market.options.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <button
                  className="resolve-submit-button"
                  onClick={handleResolve}
                  disabled={resolving}
                >
                  {resolving ? 'Resolving...' : 'Resolve Market'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
