export interface SettlementProof {
  txHash: string
  blockNumber: number
  facilitator: string
  amount: string // "1.00 USDx"
  proofHeader: string // value passed as x-paid-proof on retry
}

export interface PayAndRequestResult {
  data: Record<string, any> // unlocked JSON from the resource
  settlement: SettlementProof
}

export interface FacilitatorQuote {
  name: string
  endpoint: string
  fee: string // "0.5%"
  address: string
}

export interface Payment402Response {
  price: string
  asset: string
  facilitators: FacilitatorQuote[]
}
