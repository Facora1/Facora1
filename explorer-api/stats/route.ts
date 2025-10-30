import { NextResponse } from "next/server"
import { getSettlements } from "../state/settlements"

export async function GET() {
  const settlements = getSettlements()

  const totalVolume = settlements.reduce((sum, s) => sum + BigInt(s.amount), BigInt(0))

  const totalFees = settlements.reduce((sum, s) => sum + BigInt(s.gasCost), BigInt(0))

  return NextResponse.json({
    totalSettlements: settlements.length,
    totalVolume: totalVolume.toString(),
    totalFees: totalFees.toString(),
    facilitators: {
      alpha: {
        settlements: settlements.filter((s) => s.facilitatorAddress === process.env.FACILITATOR_ALPHA_ADDRESS).length,
        status: "live",
      },
      beta: {
        settlements: 0,
        status: "coming_soon",
      },
      gamma: {
        settlements: 0,
        status: "coming_soon",
      },
    },
  })
}
