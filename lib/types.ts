export interface PaymentRequiredResponse {
  price: string
  asset: string
  facilitators: Facilitator[]
}

export interface Facilitator {
  name: string
  fee: string
  endpoint: string
  address?: string
  live?: boolean
}

export interface SettlementResponse {
  paid: boolean
  facilitator: string
  fee: string
  txHash: string
  settlementNetwork: string
  facilitatorAddress?: string
  merchant?: string
  amount?: string
  blockNumber?: number
  balanceBefore?: string
  balanceAfter?: string
}

export interface StatsResponse {
  summary: {
    activeFacilitators: number
    requests24h: number
    volume24h: string
    avgFee: string
    uptime: string
    avgSettlementTime: string
  }
  facilitators: FacilitatorStats[]
  events: SettlementEvent[]
}

export interface FacilitatorStats {
  name: string
  status: string
  statusTone: "good" | "warn"
  fee: string
  requests: string
  volume: string
  lastTxHash: string
  bscScanUrl: string
  tags: string[]
  uptime?: string
}

export interface SettlementEvent {
  time: string
  facilitator: string
  amount: string
  route: string
  merchant: string
  txHashShort: string
  bscScanUrl: string
}

export interface SettlementState {
  lastTxHash: string | null
  lastAmount: string | null
  lastTo: string | null
  lastAt: string | null
  successCount?: number
  failureCount?: number
}
