import { ethers } from "ethers"
import { addSettlement } from "../../explorer-api/state/settlements"

export async function processPayment(body: any) {
  const provider = new ethers.JsonRpcProvider(process.env.BNB_TESTNET_RPC)
  const wallet = new ethers.Wallet(process.env.FACILITATOR_ALPHA_PRIVATE_KEY!, provider)

  const bnbBalanceBefore = await provider.getBalance(wallet.address)
  if (bnbBalanceBefore === 0n) {
    throw new Error(
      `Facilitator wallet ${wallet.address} has no BNB for gas. Please fund it with BNB testnet tokens from https://testnet.bnbchain.org/faucet-smart`,
    )
  }

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
    const { owner, value, deadline, v, r, s } = body

    const permitTx = await usdx.permit(owner, wallet.address, value, deadline, v, r, s)
    await permitTx.wait()

    const valueBigInt = BigInt(value)
    const fee = (valueBigInt * 50n) / 10000n
    const amountToMerchant = valueBigInt - fee

    const transferTx = await usdx.transferFrom(owner, process.env.MERCHANT_WALLET_ADDRESS!, amountToMerchant)
    const txReceipt = await transferTx.wait()

    const bnbBalanceAfter = await provider.getBalance(wallet.address)
    const gasCostBNB = ethers.formatEther(bnbBalanceBefore - bnbBalanceAfter)
    const amountHuman = ethers.formatUnits(amountToMerchant, Number(decimals))

    addSettlement({
      txHash: txReceipt.hash,
      amount: amountHuman,
      to: process.env.MERCHANT_WALLET_ADDRESS!,
      gasCost: gasCostBNB,
      payer: owner,
      blockNumber: txReceipt.blockNumber,
      timestamp: Date.now(),
      facilitatorAddress: wallet.address,
      feeBps: 50,
    })

    return {
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
    }
  } else {
    const amount = ethers.parseUnits("1", Number(decimals))
    const usdxBalance = await usdx.balanceOf(wallet.address)

    if (usdxBalance < amount) {
      throw new Error(
        `Facilitator wallet ${wallet.address} has ${ethers.formatUnits(usdxBalance, Number(decimals))} USDx but needs 1 USDx`,
      )
    }

    const balanceBefore = await usdx.balanceOf(wallet.address)
    const txResponse = await usdx.transfer(process.env.MERCHANT_WALLET_ADDRESS!, amount)
    const txReceipt = await txResponse.wait()
    const balanceAfter = await usdx.balanceOf(wallet.address)
    const bnbBalanceAfter = await provider.getBalance(wallet.address)
    const gasCostBNB = ethers.formatEther(bnbBalanceBefore - bnbBalanceAfter)

    addSettlement({
      txHash: txReceipt.hash,
      amount: "1.00",
      to: process.env.MERCHANT_WALLET_ADDRESS!,
      gasCost: gasCostBNB,
      payer: wallet.address,
      blockNumber: txReceipt.blockNumber,
      timestamp: Date.now(),
      facilitatorAddress: wallet.address,
      feeBps: 50,
    })

    return {
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
    }
  }
}
