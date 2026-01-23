import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

import './WalletConnectButton.css'

export function WalletConnectButton() {
  const { publicKey, connected } = useWallet()

  return (
    <div className="wallet-connect">
      {connected && publicKey && (
        <span className="wallet-address">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>
      )}
      <WalletMultiButton className="wallet-button" />
    </div>
  )
}
