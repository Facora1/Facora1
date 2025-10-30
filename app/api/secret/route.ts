import type { NextRequest } from "next/server"
import { ethers } from "ethers"

export async function GET(request: NextRequest) {
  const paidProof = request.headers.get("x-paid-proof")

  // If no payment proof, return 402
  if (!paidProof) {
    const alphaAddress = new ethers.Wallet(process.env.FACILITATOR_ALPHA_PRIVATE_KEY!).address
    const betaAddress = new ethers.Wallet(process.env.FACILITATOR_BETA_PRIVATE_KEY!).address
    const gammaAddress = new ethers.Wallet(process.env.FACILITATOR_GAMMA_PRIVATE_KEY!).address

    return Response.json(
      {
        price: "1 USDx",
        asset: process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS!,
        facilitators: [
          {
            name: "Alpha",
            fee: "0.5%",
            endpoint: "/api/facilitators/alpha",
            address: alphaAddress,
            live: true,
          },
          {
            name: "Beta",
            fee: "1.0%",
            endpoint: "/api/facilitators/beta",
            address: betaAddress,
            live: false,
          },
          {
            name: "Gamma",
            fee: "2.0%",
            endpoint: "/api/facilitators/gamma",
            address: gammaAddress,
            live: false,
          },
        ],
      },
      { status: 402 },
    )
  }

  // If payment proof exists, return the protected data
  return Response.json({
    alpha: "whale 0x9b... moved 320,000 USDx to CEX 4 min ago",
  })
}
