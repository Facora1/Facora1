import { ethers } from "ethers"

/**
 * Verify settlement proof on-chain
 * Checks that the transaction exists and matches expected parameters
 */
export async function verifySettlement(
  txHash: string,
  expectedPayer: string,
  expectedAmount: string,
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL)

  try {
    const tx = await provider.getTransaction(txHash)
    if (!tx) return false

    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt || receipt.status !== 1) return false

    // Verify transfer event matches expected parameters
    const usdxAddress = process.env.NEXT_PUBLIC_USDX_TOKEN_ADDRESS!
    const transferTopic = ethers.id("Transfer(address,address,uint256)")

    const transferLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === usdxAddress.toLowerCase() && log.topics[0] === transferTopic,
    )

    if (!transferLog) return false

    const from = ethers.getAddress("0x" + transferLog.topics[1].slice(26))
    const amount = ethers.toBigInt(transferLog.data)

    return from.toLowerCase() === expectedPayer.toLowerCase() && amount >= ethers.toBigInt(expectedAmount)
  } catch (error) {
    return false
  }
}
