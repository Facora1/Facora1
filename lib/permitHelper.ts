import { ethers } from "ethers"

export interface PermitSignature {
  owner: string
  value: string
  deadline: number
  v: number
  r: string
  s: string
}

export async function generatePermit(params: {
  buyerPrivateKey: string
  tokenAddress: string
  spender: string
  value: string
  deadline: number
  chainId?: number
}): Promise<PermitSignature> {
  const { buyerPrivateKey, tokenAddress, spender, value, deadline, chainId = 97 } = params

  const provider = new ethers.JsonRpcProvider(
    process.env.BNB_TESTNET_RPC || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  )
  const wallet = new ethers.Wallet(buyerPrivateKey, provider)

  const token = new ethers.Contract(
    tokenAddress,
    [
      "function nonces(address owner) view returns (uint256)",
      "function name() view returns (string)",
      "function version() view returns (string)",
    ],
    provider,
  )

  const nonce = await token.nonces(wallet.address)
  const name = await token.name()

  // EIP-2612 domain
  const domain = {
    name,
    version: "1",
    chainId,
    verifyingContract: tokenAddress,
  }

  // EIP-2612 Permit type
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  }

  const message = {
    owner: wallet.address,
    spender,
    value,
    nonce: nonce.toString(),
    deadline,
  }

  const signature = await wallet.signTypedData(domain, types, message)
  const sig = ethers.Signature.from(signature)

  return {
    owner: wallet.address,
    value,
    deadline,
    v: sig.v,
    r: sig.r,
    s: sig.s,
  }
}
