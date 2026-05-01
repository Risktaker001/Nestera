import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Horizon } from "@stellar/stellar-sdk";
import { COINGECKO_IDS } from "./usePrices";

export interface Balance {
  asset_code: string;
  balance: string;
  asset_type: string;
  asset_issuer?: string;
  usd_value: number;
}

export interface BalancesResult {
  balances: Balance[];
  totalUsdValue: number;
  lastSync: number;
}

function getHorizonUrl(network: string | null) {
  return network?.toLowerCase() === "public"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

async function fetchBalances(
  address: string,
  network: string | null
): Promise<BalancesResult> {
  const server = new Horizon.Server(getHorizonUrl(network));
  const account = await server.loadAccount(address);

  // Fetch prices in parallel
  const ids = Object.values(COINGECKO_IDS).join(",");
  const priceRes = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  );
  const prices = await priceRes.json();

  let totalUsdValue = 0;
  const balances: Balance[] = account.balances.map((b: any) => {
    const code = b.asset_type === "native" ? "XLM" : b.asset_code;
    const coingeckoId = COINGECKO_IDS[code];
    const price = prices[coingeckoId]?.usd ?? (code === "USDC" ? 1 : 0);
    const usd_value = parseFloat(b.balance) * price;
    totalUsdValue += usd_value;
    return { asset_code: code, balance: b.balance, asset_type: b.asset_type, asset_issuer: b.asset_issuer, usd_value };
  });

  return { balances, totalUsdValue, lastSync: Date.now() };
}

export function useWalletBalances(address: string | null, network: string | null) {
  return useQuery<BalancesResult>({
    queryKey: ["balances", address, network],
    queryFn: () => fetchBalances(address!, network),
    enabled: !!address,
    staleTime: 30_000,           // 30s stale-while-revalidate
    gcTime: 1000 * 60 * 5,      // 5 min cache
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,     // background refetch every 60s (not 30s)
    placeholderData: (prev) => prev, // show stale data while fetching
  });
}

/** Call this to force-invalidate balances (e.g. after a transaction) */
export function useInvalidateBalances() {
  const queryClient = useQueryClient();
  return (address: string) =>
    queryClient.invalidateQueries({ queryKey: ["balances", address] });
}

/** Call this on wallet disconnect to remove cached data */
export function useClearWalletCache() {
  const queryClient = useQueryClient();
  return (address: string) => {
    queryClient.removeQueries({ queryKey: ["balances", address] });
  };
}
