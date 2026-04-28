// Multi-leg expiry payoff engine. No Greeks/IV evolution — payoff at expiry only.
export type LegType = "CE" | "PE" | "FUT"
export type LegSide = "BUY" | "SELL"

export interface Leg {
  id: string
  type: LegType
  side: LegSide
  strike: number
  premium: number // per share; for FUT use 0
  qty: number // lots
  lotSize: number
}

export interface PayoffPoint {
  spot: number
  pnl: number
}

export function legPayoffAtExpiry(leg: Leg, spotAtExpiry: number): number {
  const sign = leg.side === "BUY" ? 1 : -1
  const totalQty = leg.qty * leg.lotSize
  if (leg.type === "FUT") {
    return sign * (spotAtExpiry - leg.strike) * totalQty
  }
  if (leg.type === "CE") {
    const intrinsic = Math.max(0, spotAtExpiry - leg.strike)
    return sign * (intrinsic - leg.premium) * totalQty
  }
  // PE
  const intrinsic = Math.max(0, leg.strike - spotAtExpiry)
  return sign * (intrinsic - leg.premium) * totalQty
}

export function buildPayoff(
  legs: Leg[],
  centerSpot: number,
  range = 0.15,
  steps = 200,
): PayoffPoint[] {
  if (legs.length === 0) return []
  const lo = centerSpot * (1 - range)
  const hi = centerSpot * (1 + range)
  const stepSize = (hi - lo) / steps
  const points: PayoffPoint[] = []
  for (let i = 0; i <= steps; i++) {
    const spot = lo + i * stepSize
    let pnl = 0
    for (const leg of legs) pnl += legPayoffAtExpiry(leg, spot)
    points.push({ spot, pnl })
  }
  return points
}

export interface PayoffStats {
  maxProfit: number
  maxLoss: number
  breakevens: number[]
  netPremium: number
  marginEstimate: number
}

export function payoffStats(legs: Leg[], points: PayoffPoint[]): PayoffStats {
  if (points.length === 0) {
    return { maxProfit: 0, maxLoss: 0, breakevens: [], netPremium: 0, marginEstimate: 0 }
  }
  let maxProfit = -Infinity
  let maxLoss = Infinity
  for (const p of points) {
    if (p.pnl > maxProfit) maxProfit = p.pnl
    if (p.pnl < maxLoss) maxLoss = p.pnl
  }

  // Breakevens: zero crossings
  const breakevens: number[] = []
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if ((a.pnl <= 0 && b.pnl >= 0) || (a.pnl >= 0 && b.pnl <= 0)) {
      const t = a.pnl / (a.pnl - b.pnl)
      const be = a.spot + t * (b.spot - a.spot)
      if (isFinite(be)) breakevens.push(be)
    }
  }

  // Net premium paid (positive = debit, negative = credit)
  let netPremium = 0
  for (const leg of legs) {
    if (leg.type === "FUT") continue
    const sign = leg.side === "BUY" ? 1 : -1
    netPremium += sign * leg.premium * leg.qty * leg.lotSize
  }

  // Rough margin estimate: SPAN-style not implemented; use 12% of notional for short legs
  let marginEstimate = 0
  for (const leg of legs) {
    const notional = leg.strike * leg.qty * leg.lotSize
    if (leg.side === "SELL" || leg.type === "FUT") marginEstimate += notional * 0.12
    else marginEstimate += leg.premium * leg.qty * leg.lotSize
  }

  return { maxProfit, maxLoss, breakevens, netPremium, marginEstimate }
}

// Strategy presets
export function preset(name: string, spot: number, lotSize: number): Omit<Leg, "id">[] {
  const atm = Math.round(spot / 50) * 50
  switch (name) {
    case "LONG_CALL":
      return [{ type: "CE", side: "BUY", strike: atm, premium: spot * 0.012, qty: 1, lotSize }]
    case "LONG_PUT":
      return [{ type: "PE", side: "BUY", strike: atm, premium: spot * 0.012, qty: 1, lotSize }]
    case "BULL_CALL_SPREAD":
      return [
        { type: "CE", side: "BUY", strike: atm, premium: spot * 0.012, qty: 1, lotSize },
        { type: "CE", side: "SELL", strike: atm + 200, premium: spot * 0.006, qty: 1, lotSize },
      ]
    case "BEAR_PUT_SPREAD":
      return [
        { type: "PE", side: "BUY", strike: atm, premium: spot * 0.012, qty: 1, lotSize },
        { type: "PE", side: "SELL", strike: atm - 200, premium: spot * 0.006, qty: 1, lotSize },
      ]
    case "IRON_CONDOR":
      return [
        { type: "PE", side: "SELL", strike: atm - 200, premium: spot * 0.005, qty: 1, lotSize },
        { type: "PE", side: "BUY", strike: atm - 400, premium: spot * 0.002, qty: 1, lotSize },
        { type: "CE", side: "SELL", strike: atm + 200, premium: spot * 0.005, qty: 1, lotSize },
        { type: "CE", side: "BUY", strike: atm + 400, premium: spot * 0.002, qty: 1, lotSize },
      ]
    case "STRADDLE":
      return [
        { type: "CE", side: "BUY", strike: atm, premium: spot * 0.012, qty: 1, lotSize },
        { type: "PE", side: "BUY", strike: atm, premium: spot * 0.012, qty: 1, lotSize },
      ]
    case "STRANGLE":
      return [
        { type: "CE", side: "BUY", strike: atm + 200, premium: spot * 0.006, qty: 1, lotSize },
        { type: "PE", side: "BUY", strike: atm - 200, premium: spot * 0.006, qty: 1, lotSize },
      ]
    case "COVERED_CALL":
      return [
        { type: "FUT", side: "BUY", strike: spot, premium: 0, qty: 1, lotSize },
        { type: "CE", side: "SELL", strike: atm + 200, premium: spot * 0.006, qty: 1, lotSize },
      ]
    default:
      return []
  }
}
