import type { NextRequest } from "next/server"

/**
 * Drop-in 402 endpoint example
 * Returns a 402 Payment Required response with facilitator list
 */
export async function GET(req: NextRequest) {
  const price = "1000000" // 1 USDx (6 decimals)
  const asset = process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS!

  return new Response(
    JSON.stringify({
      secret: "This content is locked",
      price,
      asset,
      facilitators: [
        {
          name: "Alpha",
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/facilitators/alpha`,
          feeBps: 50,
          status: "live",
        },
      ],
    }),
    {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "X-Payment-Required": "true",
      },
    },
  )
}
