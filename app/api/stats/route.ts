import { NextResponse } from "next/server"
import { getAllSettlements, settlementState } from "../_state/settlements"

export async function GET() {
  const settlements = getAllSettlements()

  const alphaActive = settlements.alpha.lastTxHash !== null
  const betaActive = settlements.beta.lastTxHash !== null
  const gammaActive = settlements.gamma.lastTxHash !== null

  const activeFacilitators = [alphaActive, betaActive, gammaActive].filter(Boolean).length

  const totalAlphaRequests = settlements.alpha.successCount + settlements.alpha.failureCount
  const alphaUptime =
    totalAlphaRequests > 0 ? `${((settlements.alpha.successCount / totalAlphaRequests) * 100).toFixed(1)}%` : "N/A"

  const totalRequests = settlementState.totals.totalRequests
  const totalVolume = `${settlementState.totals.totalVolume.toFixed(2)} USDx`
  const gasSponsored = `${settlementState.totals.totalGasBNB.toFixed(6)} BNB`

  return NextResponse.json({
    summary: {
      activeFacilitators,
      requests24h: totalRequests,
      volume24h: totalVolume,
      avgFee: "0.7%",
      uptime: alphaActive ? alphaUptime : "0%",
      avgSettlementTime: alphaActive ? "< 2s" : "N/A",
      merchantRevenue: totalVolume,
      merchantAddress: process.env.MERCHANT_WALLET_ADDRESS || "Not configured",
      gasSponsored24h: gasSponsored,
    },
    facilitators: [
      {
        name: "Facilitator Alpha",
        status: alphaActive ? "LIVE" : "OFFLINE",
        statusTone: alphaActive ? ("good" as const) : ("warn" as const),
        fee: "0.5%",
        requests: String(settlements.alpha.successCount),
        volume: `${settlements.alpha.successCount}.00 USDx`,
        lastTxHash: settlements.alpha.lastTxHash
          ? `${settlements.alpha.lastTxHash.slice(0, 6)}...${settlements.alpha.lastTxHash.slice(-4)}`
          : "No tx yet",
        bscScanUrl: settlements.alpha.lastTxHash
          ? `https://testnet.bscscan.com/tx/${settlements.alpha.lastTxHash}`
          : "",
        tags: alphaActive ? ["Pays gas for user", "Auto-settlement <2s"] : ["Offline"],
        uptime: alphaUptime,
      },
      {
        name: "Facilitator Beta",
        status: betaActive ? "LIVE" : "OFFLINE",
        statusTone: betaActive ? ("good" as const) : ("warn" as const),
        fee: "1.0%",
        requests: String(settlements.beta.successCount),
        volume: `${settlements.beta.successCount}.00 USDx`,
        lastTxHash: settlements.beta.lastTxHash
          ? `${settlements.beta.lastTxHash.slice(0, 6)}...${settlements.beta.lastTxHash.slice(-4)}`
          : "No tx yet",
        bscScanUrl: settlements.beta.lastTxHash ? `https://testnet.bscscan.com/tx/${settlements.beta.lastTxHash}` : "",
        tags: betaActive ? ["Pays gas for user"] : ["Offline"],
      },
      {
        name: "Facilitator Gamma",
        status: gammaActive ? "LIVE" : "OFFLINE",
        statusTone: gammaActive ? ("good" as const) : ("warn" as const),
        fee: "2.0%",
        requests: String(settlements.gamma.successCount),
        volume: `${settlements.gamma.successCount}.00 USDx`,
        lastTxHash: settlements.gamma.lastTxHash
          ? `${settlements.gamma.lastTxHash.slice(0, 6)}...${settlements.gamma.lastTxHash.slice(-4)}`
          : "No tx yet",
        bscScanUrl: settlements.gamma.lastTxHash
          ? `https://testnet.bscscan.com/tx/${settlements.gamma.lastTxHash}`
          : "",
        tags: gammaActive ? ["Fast priority", "2.0% fee"] : ["Offline"],
      },
    ],
    events: [
      ...(settlements.alpha.lastTxHash
        ? [
            {
              time: settlements.alpha.lastAt
                ? new Date(settlements.alpha.lastAt).toLocaleTimeString("en-US", { hour12: false })
                : "Unknown",
              facilitator: "Alpha",
              amount: settlements.alpha.lastAmount || "1.00 USDx",
              route: "/api/secret",
              merchant: settlements.alpha.lastTo
                ? `${settlements.alpha.lastTo.slice(0, 6)}...${settlements.alpha.lastTo.slice(-4)}`
                : "Unknown",
              txHashShort: `${settlements.alpha.lastTxHash.slice(0, 6)}...${settlements.alpha.lastTxHash.slice(-4)}`,
              bscScanUrl: `https://testnet.bscscan.com/tx/${settlements.alpha.lastTxHash}`,
            },
          ]
        : []),
      ...(settlements.beta.lastTxHash
        ? [
            {
              time: settlements.beta.lastAt
                ? new Date(settlements.beta.lastAt).toLocaleTimeString("en-US", { hour12: false })
                : "Unknown",
              facilitator: "Beta",
              amount: settlements.beta.lastAmount || "1.00 USDx",
              route: "/api/secret",
              merchant: settlements.beta.lastTo
                ? `${settlements.beta.lastTo.slice(0, 6)}...${settlements.beta.lastTo.slice(-4)}`
                : "Unknown",
              txHashShort: `${settlements.beta.lastTxHash.slice(0, 6)}...${settlements.beta.lastTxHash.slice(-4)}`,
              bscScanUrl: `https://testnet.bscscan.com/tx/${settlements.beta.lastTxHash}`,
            },
          ]
        : []),
      ...(settlements.gamma.lastTxHash
        ? [
            {
              time: settlements.gamma.lastAt
                ? new Date(settlements.gamma.lastAt).toLocaleTimeString("en-US", { hour12: false })
                : "Unknown",
              facilitator: "Gamma",
              amount: settlements.gamma.lastAmount || "1.00 USDx",
              route: "/api/secret",
              merchant: settlements.gamma.lastTo
                ? `${settlements.gamma.lastTo.slice(0, 6)}...${settlements.gamma.lastTo.slice(-4)}`
                : "Unknown",
              txHashShort: `${settlements.gamma.lastTxHash.slice(0, 6)}...${settlements.gamma.lastTxHash.slice(-4)}`,
              bscScanUrl: `https://testnet.bscscan.com/tx/${settlements.gamma.lastTxHash}`,
            },
          ]
        : []),
    ],
  })
}
