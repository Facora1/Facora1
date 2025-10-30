import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { updateSettlement } from "../../_state/settlements"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const provider = new ethers.JsonRpcProvider(process.env.BNB_TESTNET_RPC)
    const wallet = new ethers.Wallet(process.env.FACILITATOR_GAMMA_PRIVATE_KEY!, provider)

    const bnbBalance = await provider.getBalance(wallet.address)
    if (bnbBalance === 0n) {
      return NextResponse.json(
        {
          error: "Insufficient gas",
          details: `Facilitator wallet ${wallet.address} has no BNB for gas. Please fund it with BNB testnet tokens from https://testnet.bnbchain.org/faucet-smart`,
        },
        { status: 400 },
      )
    }

    // Create contract instance for USDx token
    const usdx = new ethers.Contract(
      process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS!,
      [
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
      ],
      wallet,
    )

    // Transfer exactly 1 USDx to merchant
    const decimals = await usdx.decimals()
    const amount = ethers.parseUnits("1", Number(decimals))

    const usdxBalance = await usdx.balanceOf(wallet.address)
    if (usdxBalance < amount) {
      return NextResponse.json(
        {
          error: "Insufficient USDx balance",
          details: `Facilitator wallet ${wallet.address} has ${ethers.formatUnits(usdxBalance, Number(decimals))} USDx but needs 1 USDx. Please fund it with USDx tokens at ${process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS}`,
        },
        { status: 400 },
      )
    }

    const txResponse = await usdx.transfer(process.env.MERCHANT_WALLET_ADDRESS!, amount)
    const txReceipt = await txResponse.wait()

    updateSettlement("gamma", {
      txHash: txReceipt.hash,
      amount: "1.00 USDx",
      to: process.env.MERCHANT_WALLET_ADDRESS!,
    })

    return NextResponse.json(
      {
        paid: true,
        facilitator: "Gamma",
        facilitatorAddress: wallet.address,
        fee: "2.0%",
        amount: "1.00 USDx",
        asset: process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS,
        merchant: process.env.MERCHANT_WALLET_ADDRESS,
        txHash: txReceipt.hash,
        network: "BNB Testnet",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Gamma facilitator error:", error)
    return NextResponse.json(
      { error: "Settlement failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
