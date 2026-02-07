import { type MarketOption } from '@/data/markets'

const BASIS_POINTS = 10000000n
const VIRTUAL_LIQUIDITY = 50n

export function getOptionPrices(options: MarketOption[]): number[] {
  const totalShares = options.reduce((sum, opt) => sum + opt.shares, 0n)

  if (totalShares === 0n) {
    const numOptions = options.length
    return options.map(() => 1 / numOptions)
  }

  return options.map(opt => {
    const price = (opt.shares * BASIS_POINTS) / totalShares
    const percentage = (price * 100n) / BASIS_POINTS
    return Number(percentage) / 100
  })
}

export function calculateBuyCost(
  shares: bigint,
  options: MarketOption[],
  collateralBalance: bigint,
  targetIndex: number
): { costTokens: bigint; newOptions: MarketOption[] } {
  const newShares = shares
  const totalBefore = options.reduce((sum, opt) => sum + opt.shares, 0n)

  let collateralNeeded: bigint
  if (totalBefore === 0n) {
    collateralNeeded = newShares * VIRTUAL_LIQUIDITY
  } else {
    const totalAfter = totalBefore + newShares
    const ratio = collateralBalance * newShares
    collateralNeeded = ratio / totalAfter
  }

  const newOptions = options.map((opt, idx) =>
    idx === targetIndex
      ? { ...opt, shares: opt.shares + newShares }
      : opt
  )

  return {
    costTokens: collateralNeeded / 10n,
    newOptions
  }
}

export function calculatePotentialPayout(shares: bigint): number {
  const payout = shares / 10n
  return Number(payout)
}

export function formatPrice(price: number): string {
  return `$${(price * 100).toFixed(2)}¢`
}

export function calculateSellPayout(
  shares: bigint,
  options: MarketOption[],
  collateralBalance: bigint,
  optionIndex: number
): { payoutTokens: bigint; newOptions: MarketOption[] } {
  const totalSharesBefore = options.reduce((sum, opt) => sum + opt.shares, 0n)
  const sharesToSell = shares

  let payout: bigint
  if (totalSharesBefore <= sharesToSell) {
    payout = collateralBalance
  } else {
    const ratio = collateralBalance * sharesToSell
    payout = ratio / totalSharesBefore
  }

  const newOptions = options.map((opt, idx) =>
    idx === optionIndex
      ? { ...opt, shares: opt.shares - sharesToSell }
      : opt
  )

  return {
    payoutTokens: payout / 10n,
    newOptions
  }
}
