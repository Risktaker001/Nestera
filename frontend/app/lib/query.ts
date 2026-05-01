import { type QueryClient } from "@tanstack/react-query";

export const QUERY_PERSIST_KEY = "nestera-react-query-cache";
export const QUERY_CACHE_MAX_AGE = 1000 * 60 * 10;
export const QUERY_MAX_CACHE_ENTRIES = 24;

export const WALLET_BALANCE_STALE_TIME = 1000 * 30;
export const WALLET_BALANCE_GC_TIME = 1000 * 60 * 5;
export const COINGECKO_PRICE_STALE_TIME = 1000 * 60 * 5;
export const COINGECKO_PRICE_GC_TIME = 1000 * 60 * 15;
export const STATIC_QUERY_STALE_TIME = Number.POSITIVE_INFINITY;
export const STATIC_QUERY_GC_TIME = Number.POSITIVE_INFINITY;

export const coingeckoPriceQueryKey = ["coingecko-prices"] as const;

export const walletBalanceQueryKey = (
  address: string | null,
  network: string | null,
) => ["wallet-balances", network ?? "unknown", address ?? "unknown"] as const;

export const savingsPoolsQueryKey = ["savings-pools"] as const;
export const savingsPoolDepositStateQueryKey = [
  "savings-pools",
  "deposit-state",
] as const;

export function trimQueryCache(
  queryClient: QueryClient,
  maxEntries = QUERY_MAX_CACHE_ENTRIES,
) {
  const queries = queryClient.getQueryCache().findAll();

  if (queries.length <= maxEntries) {
    return;
  }

  const excessQueries = [...queries]
    .sort((left, right) => left.state.dataUpdatedAt - right.state.dataUpdatedAt)
    .slice(0, queries.length - maxEntries);

  excessQueries.forEach((query) => {
    queryClient.removeQueries({ queryKey: query.queryKey, exact: true });
  });
}
