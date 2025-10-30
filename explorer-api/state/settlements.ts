export interface Settlement {
  txHash: string
  amount: string
  to: string
  gasCost: string
  timestamp: number
  payer?: string
  facilitatorAddress?: string
  blockNumber?: number
  feeBps?: number
}

const settlements: Settlement[] = []

export function addSettlement(settlement: Settlement) {
  settlements.push(settlement)
}

export function getSettlements(): Settlement[] {
  return settlements
}

export function getSettlementByTxHash(txHash: string): Settlement | undefined {
  return settlements.find((s) => s.txHash === txHash)
}
