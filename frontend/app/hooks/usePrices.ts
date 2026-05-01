import { useQuery } from "@tanstack/react-query";

export const COINGECKO_IDS: Record<string, string> = {
  XLM: "stellar",
  USDC: "usd-coin",
  AQUA: "aqua",
};

type PriceMap = Record<string, { usd: number }>;

async function fetchPrices(): Promise<PriceMap> {
  const ids = Object.values(COINGECKO_IDS).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  );
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

export function usePrices() {
  return useQuery<PriceMap>({
    queryKey: ["prices"],
    queryFn: fetchPrices,
    staleTime: 1000 * 60 * 5,  // 5 minutes — price data TTL
    gcTime: 1000 * 60 * 10,    // keep in cache for 10 minutes
    refetchOnWindowFocus: false, // prices don't need window-focus refetch
    placeholderData: (prev) => prev, // stale-while-revalidate
  });
}
