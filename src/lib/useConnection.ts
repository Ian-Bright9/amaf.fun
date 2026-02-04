import { useConnection as useSolanaConnection } from '@solana/wallet-adapter-react'

export function useConnection() {
  return useSolanaConnection().connection
}
