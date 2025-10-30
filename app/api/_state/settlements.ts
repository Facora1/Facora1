export const settlementState = {
  alpha: {
    lastTxHash: null as string | null,
    lastAmount: null as string | null,
    lastTo: null as string | null,
    lastPayer: null as string | null,
    lastAt: null as string | null,
    lastGasCost: null as string | null,
    lastBlockNumber: null as number | null,
    successCount: 0,
    failureCount: 0,
  },
  beta: {
    lastTxHash: null as string | null,
    lastAmount: null as string | null,
    lastTo: null as string | null,
    lastPayer: null as string | null,
    lastAt: null as string | null,
    lastGasCost: null as string | null,
    lastBlockNumber: null as number | null,
    successCount: 0,
    failureCount: 0,
  },
  gamma: {
    lastTxHash: null as string | null,
    lastAmount: null as string | null,
    lastTo: null as string | null,
    lastPayer: null as string | null,
    lastAt: null as string | null,
    lastGasCost: null as string | null,
    lastBlockNumber: null as number | null,
    successCount: 0,
    failureCount: 0,
  },
  totals: {
    totalRequests: 0,
    totalVolume: 0,
    totalGasBNB: 0,
  },
}

export function updateSettlement(
  facilitator: "alpha" | "beta" | "gamma",
  data: {
    txHash: string
    amount: string
    to: string
    gasCost?: string
    payer?: string
    blockNumber?: number
    timestamp?: number
  },
) {
  settlementState[facilitator].lastTxHash = data.txHash
  settlementState[facilitator].lastAmount = data.amount
  settlementState[facilitator].lastTo = data.to
  settlementState[facilitator].lastPayer = data.payer || null
  settlementState[facilitator].lastAt = data.timestamp
    ? new Date(data.timestamp).toISOString()
    : new Date().toISOString()
  settlementState[facilitator].lastGasCost = data.gasCost || null
  settlementState[facilitator].lastBlockNumber = data.blockNumber || null
  settlementState[facilitator].successCount++

  settlementState.totals.totalRequests += 1
  settlementState.totals.totalVolume += 1.0
  if (data.gasCost) {
    settlementState.totals.totalGasBNB += Number.parseFloat(data.gasCost)
  }
}

export function recordFailure(facilitator: "alpha" | "beta" | "gamma") {
  settlementState[facilitator].failureCount++
}

export function getAllSettlements() {
  return { ...settlementState }
}
