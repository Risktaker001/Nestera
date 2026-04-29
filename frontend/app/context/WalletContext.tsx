"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  isConnected,
  getAddress,
  getNetwork,
  requestAccess,
  WatchWalletChanges,
} from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";
import {
  COINGECKO_PRICE_GC_TIME,
  COINGECKO_PRICE_STALE_TIME,
  coingeckoPriceQueryKey,
  walletBalanceQueryKey,
  WALLET_BALANCE_GC_TIME,
  WALLET_BALANCE_STALE_TIME,
} from "@/app/lib/query";

/** Matches the CallbackParams shape from @stellar/freighter-api's WatchWalletChanges. */
interface WalletChangeEvent {
  address: string;
  network: string;
  networkPassphrase: string;
  error?: unknown;
}

interface Balance {
  asset_code: string;
  balance: string;
  asset_type: string;
  asset_issuer?: string;
  usd_value: number;
}

interface WalletState {
  address: string | null;
  network: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isBalancesLoading: boolean;
  error: string | null;
  balanceError: string | null;
  balances: Balance[];
  totalUsdValue: number;
  lastBalanceSync: number | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  fetchBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const COINGECKO_IDS: Record<string, string> = {
  XLM: "stellar",
  USDC: "usd-coin",
  AQUA: "aqua",
};

interface CoingeckoPrices {
  [assetId: string]: {
    usd?: number;
  };
}

interface WalletBalanceSnapshot {
  balances: Balance[];
  totalUsdValue: number;
  lastBalanceSync: number;
}

async function fetchCoingeckoPrices(): Promise<CoingeckoPrices> {
  const assetIds = Object.values(COINGECKO_IDS).join(",");
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${assetIds}&vs_currencies=usd`,
  );

  if (!response.ok) {
    throw new Error("Unable to load price data from CoinGecko.");
  }

  return response.json();
}

function buildBalanceSnapshot(
  accountBalances: any[],
  prices: CoingeckoPrices,
): WalletBalanceSnapshot {
  let totalUsdValue = 0;

  const balances: Balance[] = accountBalances.map((balance) => {
    const code = balance.asset_type === "native" ? "XLM" : balance.asset_code;
    const coingeckoId = COINGECKO_IDS[code];
    const price = prices[coingeckoId]?.usd || (code === "USDC" ? 1 : 0);
    const usdValue = parseFloat(balance.balance) * price;

    totalUsdValue += usdValue;

    return {
      asset_code: code,
      balance: balance.balance,
      asset_type: balance.asset_type,
      asset_issuer: balance.asset_issuer,
      usd_value: usdValue,
    };
  });

  return {
    balances,
    totalUsdValue,
    lastBalanceSync: Date.now(),
  };
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    network: null,
    isConnected: false,
    isLoading: false,
    isBalancesLoading: false,
    error: null,
    balanceError: null,
    balances: [],
    totalUsdValue: 0,
    lastBalanceSync: null,
  });

  const networkWatcher = useRef<WatchWalletChanges | null>(null);
  const queryClient = useQueryClient();

  const getHorizonUrl = (network: string | null) => {
    return network?.toLowerCase() === "public"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";
  };

  const balanceQuery = useQuery<WalletBalanceSnapshot>({
    queryKey: walletBalanceQueryKey(state.address, state.network),
    enabled: Boolean(state.address),
    queryFn: async () => {
      if (!state.address) {
        throw new Error("Wallet address is missing.");
      }

      const horizonUrl = getHorizonUrl(state.network);
      const server = new Horizon.Server(horizonUrl);
      const account = await server.loadAccount(state.address);

      const prices = await queryClient.fetchQuery({
        queryKey: coingeckoPriceQueryKey,
        queryFn: fetchCoingeckoPrices,
        staleTime: COINGECKO_PRICE_STALE_TIME,
        gcTime: COINGECKO_PRICE_GC_TIME,
      });

      return buildBalanceSnapshot(account.balances as any[], prices);
    },
    staleTime: WALLET_BALANCE_STALE_TIME,
    gcTime: WALLET_BALANCE_GC_TIME,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });

  const fetchBalances = useCallback(async () => {
    if (!state.address) return;

    await balanceQuery.refetch();
  }, [balanceQuery, state.address]);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const connected = await isConnected();
        if (connected?.isConnected) {
          const [addrResult, netResult] = await Promise.all([
            getAddress(),
            getNetwork(),
          ]);
          if (addrResult?.address) {
            setState((s) => ({
              ...s,
              address: addrResult.address,
              network: netResult?.network ?? null,
              isConnected: true,
              isLoading: false,
              error: null,
            }));
          }
        }
      } catch {
        // Freighter not installed or not connected — silent fail
      }
    })();
  }, []);

  useEffect(() => {
    if (state.isConnected || state.address) {
      return;
    }

    queryClient.removeQueries({ queryKey: ["wallet-balances"] });
  }, [queryClient, state.address, state.isConnected]);

  // Watch for network changes when wallet is connected
  useEffect(() => {
    if (!state.isConnected) {
      // Clean up watcher when wallet is disconnected
      if (networkWatcher.current) {
        try {
          networkWatcher.current.stop();
        } catch (error) {
          console.error("Error stopping network watcher:", error);
        }
        networkWatcher.current = null;
      }
      return;
    }

    try {
      // Initialize watcher to poll every 3 seconds
      networkWatcher.current = new WatchWalletChanges(3000);

      networkWatcher.current.watch((changes: WalletChangeEvent) => {
        if (changes.network && changes.network !== state.network) {
          setState((prevState) => ({
            ...prevState,
            network: changes.network,
          }));
        }
      });
    } catch (error) {
      console.error("Failed to initialize network watcher:", error);
    }

    // Cleanup function
    return () => {
      if (networkWatcher.current) {
        try {
          networkWatcher.current.stop();
        } catch (error) {
          console.error("Error stopping network watcher:", error);
        }
        networkWatcher.current = null;
      }
    };
  }, [state.isConnected, state.network]);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const accessResult = await requestAccess();
      if (accessResult?.error) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: accessResult.error ?? "Connection rejected",
        }));
        return;
      }
      const [addrResult, netResult] = await Promise.all([
        getAddress(),
        getNetwork(),
      ]);
      setState((s) => ({
        ...s,
        address: addrResult?.address ?? null,
        network: netResult?.network ?? null,
        isConnected: !!addrResult?.address,
        isLoading: false,
        error: null,
        balanceError: null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["wallet-balances"] });
    setState((s) => ({
      ...s,
      address: null,
      network: null,
      isConnected: false,
      isLoading: false,
      error: null,
      balanceError: null,
      balances: [],
      totalUsdValue: 0,
      isBalancesLoading: false,
      lastBalanceSync: null,
    }));
  }, [queryClient]);

  const balances = balanceQuery.data?.balances ?? [];
  const totalUsdValue = balanceQuery.data?.totalUsdValue ?? 0;
  const lastBalanceSync = balanceQuery.data?.lastBalanceSync ?? null;
  const isBalancesLoading = Boolean(state.address) && balanceQuery.isFetching;
  const balanceError = balanceQuery.error
    ? balanceQuery.error instanceof Error
      ? balanceQuery.error.message
      : "Unable to refresh wallet balances."
    : null;

  return (
    <WalletContext.Provider
      value={{
        ...state,
        balances,
        totalUsdValue,
        lastBalanceSync,
        isBalancesLoading,
        balanceError,
        connect,
        disconnect,
        fetchBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
