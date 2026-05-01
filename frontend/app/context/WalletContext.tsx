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
import { useQueryClient } from "@tanstack/react-query";
import { useWalletBalances, Balance } from "../hooks/useWalletBalances";
import { Horizon } from "@stellar/stellar-sdk";
import {
  COINGECKO_PRICE_GC_TIME,
  COINGECKO_PRICE_STALE_TIME,
  coingeckoPriceQueryKey,
  walletBalanceQueryKey,
  WALLET_BALANCE_GC_TIME,
  WALLET_BALANCE_STALE_TIME,
} from "@/app/lib/query";
import { env } from "../config/env";

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

/** Connection status types */
type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "locked" | "error";

interface WalletState {
  address: string | null;
  network: string | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  balanceError: string | null;
  balances: Balance[];
  totalUsdValue: number;
  lastBalanceSync: number | null;
  lastConnectedNetwork: string | null;
  isWalletLocked: boolean;
  hasConnectionIssue: boolean;
}

interface WalletContextValue extends WalletState {
  // Derived from React Query
  balances: Balance[];
  totalUsdValue: number;
  isBalancesLoading: boolean;
  balanceError: string | null;
  lastBalanceSync: number | null;
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  fetchBalances: () => Promise<void>;
  reconnect: () => Promise<void>;
  clearError: () => void;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

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
// Storage keys for persistence
const STORAGE_KEYS = {
  LAST_NETWORK: "nestera_last_network",
  WALLET_CONNECTION: "nestera_wallet_connection",
  LAST_CONNECTION_TIME: "nestera_last_connection_time",
};

// Connection timeout (10 seconds)
const CONNECTION_TIMEOUT = 10000;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    network: null,
    isConnected: false,
    connectionStatus: "idle",
    isLoading: false,
    error: null,
  });

  const queryClient = useQueryClient();
    balanceError: null,
    balances: [],
    totalUsdValue: 0,
    lastBalanceSync: null,
    lastConnectedNetwork: null,
    isWalletLocked: false,
    hasConnectionIssue: false,
  });

  const networkWatcher = useRef<WatchWalletChanges | null>(null);
  const queryClient = useQueryClient();
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // React Query handles fetching, caching, and background refetch
  const {
    data,
    isFetching: isBalancesLoading,
    error: balancesQueryError,
    refetch,
  } = useWalletBalances(state.address, state.network);

  const balances = data?.balances ?? [];
  const totalUsdValue = data?.totalUsdValue ?? 0;
  const lastBalanceSync = data?.lastSync ?? null;
  const balanceError = balancesQueryError
    ? (balancesQueryError as Error).message
    : null;

  // Expose a manual refetch for backwards compatibility
  const fetchBalances = useCallback(async () => {
    await refetch();
  }, [refetch]);
  // Utility: Get Horizon URL based on network
  const getHorizonUrl = (network: string | null) => {
    return network?.toLowerCase() === "public"
      ? env.horizonPublicUrl
      : env.horizonTestnetUrl;
  };

  // Utility: Save network preference to localStorage
  const saveNetworkPreference = (network: string) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_NETWORK, network);
      } catch (err) {
        console.warn("Could not save network preference:", err);
      }
    }
  };

  // Utility: Get saved network preference from localStorage
  const getSavedNetworkPreference = () => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(STORAGE_KEYS.LAST_NETWORK);
      } catch (err) {
        console.warn("Could not retrieve network preference:", err);
        return null;
      }
    }
    return null;
  };

  const balanceQuery = useQuery<WalletBalanceSnapshot>({
    queryKey: walletBalanceQueryKey(state.address, state.network),
    enabled: Boolean(state.address),
    queryFn: async () => {
      if (!state.address) {
        throw new Error("Wallet address is missing.");
      }
  // Utility: Check if wallet is disconnected from extension
  const checkWalletDisconnection = useCallback(async () => {
    if (!state.address || !state.isConnected) return;

    try {
      const connected = await isConnected();
      if (!connected?.isConnected) {
        // Wallet disconnected from extension
        setState((s) => ({
          ...s,
          isWalletLocked: false,
          hasConnectionIssue: true,
          connectionStatus: "disconnected",
          error: "Wallet disconnected. Click Reconnect to restore connection.",
        }));
      }
    } catch (error) {
      console.error("Error checking disconnection:", error);
      setState((s) => ({
        ...s,
        hasConnectionIssue: true,
        error: "Failed to verify wallet connection.",
      }));
    }
  }, [state.address, state.isConnected]);

  const fetchBalances = useCallback(async () => {
    if (!state.address) return;

    setState((s) => ({ ...s, isBalancesLoading: true, balanceError: null }));

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
      // Fetch prices
      const assetIds = Object.values(COINGECKO_IDS).join(",");
      const priceRes = await fetch(
        `${env.coinGeckoApiUrl}/simple/price?ids=${assetIds}&vs_currencies=usd`
      );
      const prices = await priceRes.json();

      let totalUsd = 0;
      const balances: Balance[] = account.balances.map((b: any) => {
        const code = b.asset_type === "native" ? "XLM" : b.asset_code;
        const coingeckoId = COINGECKO_IDS[code];
        const price = prices[coingeckoId]?.usd || (code === "USDC" ? 1 : 0);
        const usdValue = parseFloat(b.balance) * price;
        totalUsd += usdValue;

        return {
          asset_code: code,
          balance: b.balance,
          asset_type: b.asset_type,
          asset_issuer: b.asset_issuer,
          usd_value: usdValue,
        };
      });

      setState((s) => ({
        ...s,
        balances,
        totalUsdValue: totalUsd,
        isBalancesLoading: false,
        balanceError: null,
        lastBalanceSync: Date.now(),
        hasConnectionIssue: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unable to refresh wallet balances.";
      console.error("Failed to fetch balances:", err);

      // Detect if error might be due to disconnection
      if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
        setState((s) => ({
          ...s,
          isBalancesLoading: false,
          balanceError: errorMessage,
          hasConnectionIssue: true,
        }));
      } else {
        setState((s) => ({
          ...s,
          isBalancesLoading: false,
          balanceError: errorMessage,
        }));
      }
    }
  }, [state.address, state.network]);

  // Restore session on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    (async () => {
      try {
        setState((s) => ({ ...s, connectionStatus: "connecting" }));
        const connected = await isConnected();

        if (connected?.isConnected) {
          const [addrResult, netResult] = await Promise.all([
            getAddress(),
            getNetwork(),
          ]);

          if (addrResult?.address) {
            const network = netResult?.network ?? getSavedNetworkPreference() ?? null;
            if (network) {
              saveNetworkPreference(network);
            }

            setState((s) => ({
              ...s,
              address: addrResult.address,
              network,
              lastConnectedNetwork: network,
              isConnected: true,
              connectionStatus: "connected",
              isLoading: false,
              error: null,
              isWalletLocked: false,
              hasConnectionIssue: false,
            }));
          }
        } else {
          setState((s) => ({
            ...s,
            connectionStatus: "disconnected",
          }));
        }
      } catch (err) {
        console.error("Session restoration failed:", err);
        // Freighter not installed or not connected — silent fail
        setState((s) => ({
          ...s,
          connectionStatus: "idle",
        }));
      }
    })();
  }, []);

  // Watch for network/address changes when wallet is connected
  useEffect(() => {
    if (state.isConnected || state.address) {
      return;
    }

    queryClient.removeQueries({ queryKey: ["wallet-balances"] });
  }, [queryClient, state.address, state.isConnected]);
    if (state.address) {
      fetchBalances();

      // Real-time balance updates every 30 seconds
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      refreshInterval.current = setInterval(fetchBalances, 30000);

      // Check for disconnection every 15 seconds
      if (disconnectionCheckInterval.current) {
        clearInterval(disconnectionCheckInterval.current);
      }
      disconnectionCheckInterval.current = setInterval(checkWalletDisconnection, 15000);
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
      if (disconnectionCheckInterval.current) {
        clearInterval(disconnectionCheckInterval.current);
        disconnectionCheckInterval.current = null;
      }

      setState((s) => ({
        ...s,
        balances: [],
        totalUsdValue: 0,
        isBalancesLoading: false,
        balanceError: null,
        lastBalanceSync: null,
      }));
    }

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      if (disconnectionCheckInterval.current) clearInterval(disconnectionCheckInterval.current);
    };
  }, [state.address, fetchBalances, checkWalletDisconnection]);

  // Watch for network changes and disconnections when wallet is connected
  useEffect(() => {
    if (!state.isConnected) {
      if (networkWatcher.current) {
        try { networkWatcher.current.stop(); } catch {}
        networkWatcher.current = null;
      }
      return;
    }

    try {
      networkWatcher.current = new WatchWalletChanges(3000);
      networkWatcher.current.watch((changes: WalletChangeEvent) => {
        // Detect disconnection
        if (changes.error) {
          console.error("Wallet watch error:", changes.error);
          setState((s) => ({
            ...s,
            isWalletLocked: true,
            connectionStatus: "locked",
            error: "Wallet appears to be locked. Click Reconnect to restore access.",
            hasConnectionIssue: true,
          }));
          return;
        }

        // Detect network changes
        if (changes.network && changes.network !== state.network) {
          setState((s) => ({ ...s, network: changes.network }));
          saveNetworkPreference(changes.network);
          setState((prevState) => ({
            ...prevState,
            network: changes.network,
            lastConnectedNetwork: changes.network,
          }));
        }

        // Detect address changes (wallet switched)
        if (changes.address && changes.address !== state.address) {
          setState((s) => ({
            ...s,
            address: changes.address,
          }));
        }
      });
    } catch (error) {
      console.error("Failed to initialize network watcher:", error);
      setState((s) => ({
        ...s,
        hasConnectionIssue: true,
        error: "Failed to monitor wallet connection.",
      }));
    }

    return () => {
      if (networkWatcher.current) {
        try { networkWatcher.current.stop(); } catch {}
        networkWatcher.current = null;
      }
    };
  }, [state.isConnected, state.network, state.address]);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, connectionStatus: "connecting", error: null }));

    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    try {
      // Set connection timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        connectionTimeoutRef.current = setTimeout(() => {
          reject(new Error("Connection timeout. Please check Freighter extension and try again."));
        }, CONNECTION_TIMEOUT);
      });

      const accessResult = await Promise.race([requestAccess(), timeoutPromise]);

      // Clear timeout if connection succeeded
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      if (accessResult?.error) {
        if (accessResult.error.includes("locked")) {
          setState((s) => ({
            ...s,
            isLoading: false,
            connectionStatus: "locked",
            isWalletLocked: true,
            error: "Wallet is locked. Please unlock in Freighter extension.",
          }));
        } else {
          setState((s) => ({
            ...s,
            isLoading: false,
            connectionStatus: "error",
            error: accessResult.error ?? "Connection rejected",
          }));
        }
        return;
      }

      const [addrResult, netResult] = await Promise.all([
        getAddress(),
        getNetwork(),
      ]);

      const network = netResult?.network ?? null;
      if (network) {
        saveNetworkPreference(network);
      }

      setState((s) => ({
        ...s,
        address: addrResult?.address ?? null,
        network,
        lastConnectedNetwork: network,
        isConnected: !!addrResult?.address,
        connectionStatus: !!addrResult?.address ? "connected" : "error",
        isLoading: false,
        error: null,
        balanceError: null,
        isWalletLocked: false,
        hasConnectionIssue: false,
      }));
    } catch (err) {
      // Clear timeout on error
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";

      // Detect specific error scenarios
      if (errorMessage.includes("locked")) {
        setState((s) => ({
          ...s,
          isLoading: false,
          connectionStatus: "locked",
          isWalletLocked: true,
          error: "Wallet is locked. Please unlock in Freighter extension.",
        }));
      } else if (errorMessage.includes("timeout")) {
        setState((s) => ({
          ...s,
          isLoading: false,
          connectionStatus: "error",
          hasConnectionIssue: true,
          error: "Connection timeout. Ensure Freighter is installed and responding.",
        }));
      } else {
        setState((s) => ({
          ...s,
          isLoading: false,
          connectionStatus: "error",
          error: errorMessage,
        }));
      }
    }
  }, []);

  const reconnect = useCallback(async () => {
    setState((s) => ({
      ...s,
      connectionStatus: "connecting",
      isLoading: true,
      error: null,
    }));

    try {
      // Check if wallet is now available
      const connected = await isConnected();
      if (!connected?.isConnected) {
        // Try to request access again
        await connect();
        return;
      }

      // Get current state
      const [addrResult, netResult] = await Promise.all([
        getAddress(),
        getNetwork(),
      ]);

      const network = netResult?.network ?? state.lastConnectedNetwork ?? null;
      if (network) {
        saveNetworkPreference(network);
      }

      setState((s) => ({
        ...s,
        address: addrResult?.address ?? null,
        network,
        lastConnectedNetwork: network,
        isConnected: !!addrResult?.address,
        connectionStatus: !!addrResult?.address ? "connected" : "error",
        isLoading: false,
        error: null,
        isWalletLocked: false,
        hasConnectionIssue: false,
      }));
    } catch (err) {
      console.error("Reconnection failed:", err);
      setState((s) => ({
        ...s,
        isLoading: false,
        connectionStatus: "error",
        error: err instanceof Error ? err.message : "Failed to reconnect wallet",
      }));
    }
  }, [connect, state.lastConnectedNetwork]);

  const disconnect = useCallback(() => {
    // Remove cached balance data for this address on disconnect
    if (state.address) {
      queryClient.removeQueries({ queryKey: ["balances", state.address] });
    }
    setState({
    queryClient.removeQueries({ queryKey: ["wallet-balances"] });
    // Clear all intervals and timeouts
    if (refreshInterval.current) clearInterval(refreshInterval.current);
    if (disconnectionCheckInterval.current) clearInterval(disconnectionCheckInterval.current);
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    if (networkWatcher.current) {
      try {
        networkWatcher.current.stop();
      } catch (error) {
        console.error("Error stopping network watcher:", error);
      }
    }

    setState((s) => ({
      ...s,
      address: null,
      network: null,
      isConnected: false,
      connectionStatus: "disconnected",
      isLoading: false,
      error: null,
    });
  }, [state.address, queryClient]);
      balanceError: null,
      balances: [],
      totalUsdValue: 0,
      isBalancesLoading: false,
      lastBalanceSync: null,
      isWalletLocked: false,
      hasConnectionIssue: false,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({
      ...s,
      error: null,
      balanceError: null,
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
        balanceError,
        lastBalanceSync,
        isBalancesLoading,
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
