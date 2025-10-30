interface PayAndRequestOptions {
  resourceUrl: string
  preferredFacilitator?: string
}

interface Facilitator {
  name: string
  fee: string
  endpoint: string
}

interface PaymentRequiredResponse {
  price: string
  asset: string
  facilitators: Facilitator[]
}

interface SettlementResponse {
  paid: boolean
  facilitator: string
  fee: string
  txHash: string
  settlementNetwork: string
}

export async function payAndRequest(opts: PayAndRequestOptions) {
  // Step 1: Call the protected resource
  const initialResponse = await fetch(opts.resourceUrl)

  // If already unlocked, return immediately
  if (initialResponse.status === 200) {
    return await initialResponse.json()
  }

  // If not 402, something went wrong
  if (initialResponse.status !== 402) {
    throw new Error(`Unexpected status: ${initialResponse.status}`)
  }

  // Step 2: Parse 402 response
  const paymentInfo: PaymentRequiredResponse = await initialResponse.json()

  // Step 3: Choose a facilitator
  let chosenFacilitator: Facilitator
  if (opts.preferredFacilitator) {
    const found = paymentInfo.facilitators.find(
      (f) => f.name.toLowerCase() === opts.preferredFacilitator?.toLowerCase(),
    )
    if (!found) {
      throw new Error(`Facilitator ${opts.preferredFacilitator} not found`)
    }
    chosenFacilitator = found
  } else {
    // Default to first (cheapest)
    chosenFacilitator = paymentInfo.facilitators[0]
  }

  // Step 4: Pay through facilitator
  const settlementResponse = await fetch(chosenFacilitator.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      permit: "mock-user-signature",
      amount: paymentInfo.price,
    }),
  })

  if (!settlementResponse.ok) {
    throw new Error("Facilitator settlement failed")
  }

  const settlement: SettlementResponse = await settlementResponse.json()

  if (!settlement.paid) {
    throw new Error("Payment not confirmed by facilitator")
  }

  // Step 5: Retry the resource with payment proof
  const unlockedResponse = await fetch(opts.resourceUrl, {
    headers: {
      "x-paid-proof": chosenFacilitator.name.toLowerCase(),
    },
  })

  if (!unlockedResponse.ok) {
    throw new Error("Failed to unlock resource after payment")
  }

  const data = await unlockedResponse.json()

  return {
    data,
    settlement,
  }
}
