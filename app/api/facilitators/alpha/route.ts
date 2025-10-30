import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { updateSettlement } from "../../_state/settlements"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const provider = new ethers.JsonRpcProvider(process.env.BNB_TESTNET_RPC)
    const wallet = new ethers.Wallet(process.env.FACILITATOR_ALPHA_PRIVATE_KEY!, provider)

    const bnbBalanceBefore = await provider.getBalance(wallet.address)
    if (bnbBalanceBefore === 0n) {
      return NextResponse.json(
        {
          error: "Insufficient gas",
          details: `Facilitator wallet ${wallet.address} has no BNB for gas. Please fund it with BNB testnet tokens from https://testnet.bnbchain.org/faucet-smart`,
        },
        { status: 400 },
      )
    }

    // Create contract instance for USDx token with EIP-2612 permit support
    const usdx = new ethers.Contract(
      process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS!,
      [
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
      ],
      wallet,
    )

    const decimals = await usdx.decimals()

    const isPermitFlow = body.owner && body.v && body.r && body.s && body.deadline && body.value

    if (isPermitFlow) {
      // EIP-2612 permit flow: user signed off-chain, Alpha settles on-chain
      const { owner, value, deadline, v, r, s } = body


      // Execute permit to approve Alpha to spend from owner's balance
      const permitTx = await usdx.permit(owner, wallet.address, value, deadline, v, r, s)
      await permitTx.wait()


      // Calculate fee (0.5% = 50 basis points)
      const valueBigInt = BigInt(value)
      const fee = (valueBigInt * 50n) / 10000n
      const amountToMerchant = valueBigInt - fee

      // Transfer from owner to merchant using transferFrom
      const transferTx = await usdx.transferFrom(owner, process.env.MERCHANT_WALLET_ADDRESS!, amountToMerchant)
      const txReceipt = await transferTx.wait()

      const bnbBalanceAfter = await provider.getBalance(wallet.address)
      const gasCostBNB = ethers.formatEther(bnbBalanceBefore - bnbBalanceAfter)

      const amountHuman = ethers.formatUnits(amountToMerchant, Number(decimals))

      updateSettlement("alpha", {
        txHash: txReceipt.hash,
        amount: `${amountHuman} USDx`,
        to: process.env.MERCHANT_WALLET_ADDRESS!,
        gasCost: gasCostBNB,
        payer: owner,
        blockNumber: txReceipt.blockNumber,
        timestamp: Date.now(),
      })

      return NextResponse.json(
        {
          settled: true,
          txHash: txReceipt.hash,
          blockNumber: txReceipt.blockNumber,
          facilitator: "Alpha",
          facilitatorAddress: wallet.address,
          merchant: process.env.MERCHANT_WALLET_ADDRESS,
          payer: owner,
          amount: `${amountHuman} USDx`,
          feeBps: 50,
          chain: "BNB Testnet",
          gasUsed: txReceipt.gasUsed.toString(),
          gasCost: gasCostBNB,
          timestamp: Date.now(),
        },
        { status: 200 },
      )
    } else {

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

      const balanceBefore = await usdx.balanceOf(wallet.address)

      const txResponse = await usdx.transfer(process.env.MERCHANT_WALLET_ADDRESS!, amount)
      const txReceipt = await txResponse.wait()

      const balanceAfter = await usdx.balanceOf(wallet.address)

      const bnbBalanceAfter = await provider.getBalance(wallet.address)
      const gasCostBNB = ethers.formatEther(bnbBalanceBefore - bnbBalanceAfter)

      updateSettlement("alpha", {
        txHash: txReceipt.hash,
        amount: "1.00 USDx",
        to: process.env.MERCHANT_WALLET_ADDRESS!,
        gasCost: gasCostBNB,
        payer: wallet.address,
        blockNumber: txReceipt.blockNumber,
        timestamp: Date.now(),
      })

      return NextResponse.json(
        {
          paid: true,
          facilitator: "Alpha",
          facilitatorAddress: wallet.address,
          fee: "0.5%",
          amount: "1.00 USDx",
          asset: process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS,
          merchant: process.env.MERCHANT_WALLET_ADDRESS,
          txHash: txReceipt.hash,
          network: "BNB Testnet",
          balanceBefore: ethers.formatUnits(balanceBefore, Number(decimals)),
          balanceAfter: ethers.formatUnits(balanceAfter, Number(decimals)),
          blockNumber: txReceipt.blockNumber,
          gasCost: gasCostBNB,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Settlement failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
