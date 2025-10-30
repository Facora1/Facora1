# @facilitator-network/sdk

A minimal TypeScript client for interacting with the Facilitator Network on BNB.

## What it does

- Calls a protected API route
- Reads the 402 Payment Required invoice (price, facilitators)
- Chooses a facilitator (e.g. Alpha)
- Submits the caller's USDx permit for settlement
- Waits for on-chain payment
- Retries the API route with `x-paid-proof`
- Returns `{ data, settlement }`

**The caller never needs BNB for gas and never broadcasts a transaction.**

## Installation

This SDK is included inline in this repository for now. It will be published to npm as `@facilitator-network/sdk`.

For now, you can:
- Clone this repo and import from `./sdk/src`
- Copy the SDK folder into your own project
- Use it as a local workspace package

## Usage

\`\`\`typescript
import { payAndRequest } from "@facilitator-network/sdk";

const result = await payAndRequest({
  resourceUrl: "http://localhost:3000/api/alpha-feed"
});

console.log(result.data.alpha);           // unlocked API response
console.log(result.settlement.txHash);    // on-chain settlement proof
console.log(result.settlement.blockNumber);
console.log(result.settlement.facilitator);
\`\`\`

## Return Shape

\`\`\`typescript
{
  data: {
    alpha: string; // your protected response body
  },
  settlement: {
    txHash: string;
    blockNumber: number;
    facilitator: string;
    amount: string;      // "1.00 USDx"
    proofHeader: string; // what gets sent as x-paid-proof
  }
}
\`\`\`

## How it works

1. **402 Negotiation** - The SDK calls your protected endpoint and receives a 402 response with price and facilitator list
2. **Facilitator Selection** - Picks the first available facilitator (future: lowest fee)
3. **EIP-2612 Permit** - Submits the caller's USDx permit signature to the facilitator
4. **On-chain Settlement** - Facilitator executes `permit()` + `transferFrom()` on BNB testnet
5. **Proof Verification** - SDK retries the endpoint with `x-paid-proof: <txHash>`
6. **Unlock** - Your API verifies the transaction on-chain and returns the protected data

## Architecture

The Facilitator Network removes the single point of failure in traditional x402 flows. Instead of one centralized facilitator, multiple operators compete to settle payments. Each facilitator stakes FAC tokens and can be slashed for misbehavior.

**Alpha is live on BNB testnet. Beta and Gamma are coming online soon.**

## License

MIT
