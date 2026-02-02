import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          AMAF Prediction Markets - Built on Solana
        </p>
        <p className="footer-links">
          <a href="https://solana.com" target="_blank" rel="noopener noreferrer">
            Solana
          </a>
          {' • '}
          <a
            href="https://github.com/solana-labs/solana-program-library"
            target="_blank"
            rel="noopener noreferrer"
          >
            SPL Token
          </a>
          {' • '}
          <a
            href="https://www.anchor-lang.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Anchor
          </a>
        </p>
      </div>
    </footer>
  )
}
