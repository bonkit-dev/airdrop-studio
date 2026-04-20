import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"

export function useSolBalance(): number {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const { data = 0 } = useQuery({
    queryKey: ["sol-balance", publicKey?.toBase58() ?? null],
    queryFn: async () => {
      if (!publicKey) return 0
      const lamports = await connection.getBalance(publicKey)
      return lamports / LAMPORTS_PER_SOL
    },
    enabled: !!publicKey,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  })

  return data
}
