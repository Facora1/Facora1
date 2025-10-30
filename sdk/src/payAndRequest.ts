import type { PayAndRequestResult, Payment402Response } from "./types"

export interface PayAndRequestOptions {
  resourceUrl: string
  permitSignature?: {
    v: number
    r: string
    s: string
    deadline: number
    owner: string
    value: string
  }
}

/**
 * Main SDK function: handles 402 negotiation, facilitator settlement, and resource unlock
 */
export async function payAndRequest(options: PayAndRequestOptions): Promise<PayAndRequestResult> {
  const { resourceUrl, permitSignature } = options

  // Step 1: Call the protected resource
  const initialResponse = await fetch(resourceUrl)

  if (initialResponse.status !== 402) {
    // Resource is not protected or already unlocked
    const data = await initialResponse.json()
    return {
      data,
      settlement: {
        txHash: "",
        blockNumber: 0,
        facilitator: "",
        amount: "0",
        proofHeader: "",
      },
    }
  }

  // Step 2: Parse 402 response
  const payment402: Payment402Response = await initialResponse.json()
  const { price, asset, facilitators } = payment402

  if (!facilitators || facilitators.length === 0) {
    throw new Error("No facilitators available")
  }

  // Step 3: Choose a facilitator (pick first one for now)
  const facilitator = facilitators[0]

  // Step 4: Submit payment to facilitator
  const settlementResponse = await fetch(facilitator.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceUrl,
      price,
      asset,
      permitSignature,
    }),
  })

  if (!settlementResponse.ok) {
    const error = await settlementResponse.text()
    throw new Error(`Facilitator settlement failed: ${error}`)
  }

  const settlement = await settlementResponse.json()

  // Step 5: Retry the resource with x-paid-proof
  const unlockedResponse = await fetch(resourceUrl, {
    headers: {
      "x-paid-proof": settlement.txHash,
    },
  })

  if (!unlockedResponse.ok) {
    throw new Error("Failed to unlock resource with payment proof")
  }

  const data = await unlockedResponse.json()

  // Step 6: Return unlocked data + settlement proof
  return {
    data,
    settlement: {
      txHash: settlement.txHash,
      blockNumber: settlement.blockNumber || 0,
      facilitator: facilitator.address,
      amount: `${price} ${asset}`,
      proofHeader: settlement.txHash,
    },
  }
}
