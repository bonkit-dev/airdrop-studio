import { BN } from "@coral-xyz/anchor"

export type TransferFeeEstimate = {
  basisPoints: number
  maxFee: BN
  feeAmount: BN
  grossAmount: BN
}

type EstimateInput = {
  netAmount: BN
  basisPoints: number
  maxFee: BN
}

const BASIS_POINTS_DENOMINATOR = 10_000n

export function estimateTransferFeeForNetAmount({ netAmount, basisPoints, maxFee }: EstimateInput): TransferFeeEstimate {
  const net = BigInt(netAmount.toString())
  const maxFeeRaw = BigInt(maxFee.toString())
  const bps = BigInt(basisPoints)

  if (net === 0n || bps === 0n || maxFeeRaw === 0n) {
    return {
      basisPoints,
      maxFee,
      feeAmount: new BN(0),
      grossAmount: new BN(net.toString()),
    }
  }

  const feeFor = (preFeeAmount: bigint) => {
    const numerator = preFeeAmount * bps
    const rawFee = (numerator + BASIS_POINTS_DENOMINATOR - 1n) / BASIS_POINTS_DENOMINATOR
    return rawFee > maxFeeRaw ? maxFeeRaw : rawFee
  }
  const netFor = (preFeeAmount: bigint) => preFeeAmount - feeFor(preFeeAmount)

  let low = net
  let high = net + maxFeeRaw + 1n

  if (netFor(high) < net) {
    let probe = high
    for (let i = 0; i < 64 && netFor(probe) < net; i += 1) {
      probe *= 2n
    }
    high = probe
  }

  while (low < high) {
    const mid = (low + high) / 2n
    if (netFor(mid) >= net) {
      high = mid
    } else {
      low = mid + 1n
    }
  }

  const grossAmount = low
  const feeAmount = feeFor(grossAmount)

  return {
    basisPoints,
    maxFee,
    feeAmount: new BN(feeAmount.toString()),
    grossAmount: new BN(grossAmount.toString()),
  }
}
