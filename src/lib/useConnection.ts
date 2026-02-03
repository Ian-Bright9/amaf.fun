import { useMemo } from 'react'
import { Connection, clusterApiUrl } from '@solana/web3.js'

export function useConnection() {
  return useMemo(() => new Connection(clusterApiUrl('devnet'), 'confirmed'), [])
}
