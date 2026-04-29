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
  isConnected,
  getAddress,
  getNetwork,
  requestAccess,
  WatchWalletChanges,
} from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";
import {
  addBreadcrumb,
  clearMonitoringUser,
  maskWalletAddress,
  setMonitoringUserFromWallet,
  trackWalletError,
} from "../lib/monitoring";

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

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const networkWatcher = useRef<WatchWalletChanges | null>(null);

  const getHorizonUrl = (network: string | null) => {
    return network?.toLowerCase() === "public"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";
  };

  const fetchBalances = useCallback(async () => {
    if (!state.address) return;

    addBreadcrumb({
      category: "wallet",
      message: "wallet.balance.refresh.started",
      level: "info",
      data: { network: state.network, walletAddressMasked: maskWalletAddress(state.address) },
    });
    setState((s) => ({ ...s, isBalancesLoading: true, balanceError: null }));

    try {
      const horizonUrl = getHorizonUrl(state.network);
      const server = new Horizon.Server(horizonUrl);
      const account = await server.loadAccount(state.address);

      // Fetch prices
      const assetIds = Object.values(COINGECKO_IDS).join(",");
      const priceRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${assetIds}&vs_currencies=usd`
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
      }));
      addBreadcrumb({
        category: "wallet",
        message: "wallet.balance.refresh.succeeded",
        level: "info",
        data: {
          network: state.network,
          walletAddressMasked: maskWalletAddress(state.address),
          assetCount: balances.length,
        },
      });
    } catch (err) {
      console.error("Failed to fetch balances:", err);
      trackWalletError({
        action: "wallet.balance.fetch_failed",
        error: err,
        network: state.network,
        address: state.address,
      });
      addBreadcrumb({
        category: "wallet",
        message: "wallet.balance.refresh.failed",
        level: "error",
        data: { network: state.network, walletAddressMasked: maskWalletAddress(state.address) },
      });
      setState((s) => ({
        ...s,
        isBalancesLoading: false,
        balanceError:
          err instanceof Error ? err.message : "Unable to refresh wallet balances.",
      }));
    }
  }, [state.address, state.network]);

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
            setMonitoringUserFromWallet(addrResult.address, netResult?.network ?? null);
            addBreadcrumb({
              category: "wallet",
              message: "wallet.session.restored",
              level: "info",
              data: {
                network: netResult?.network ?? null,
                walletAddressMasked: maskWalletAddress(addrResult.address),
              },
            });
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
      } catch (error) {
        trackWalletError({
          action: "wallet.session.restore_failed",
          error,
        });
      }
    })();
  }, []);

  // Fetch balances when address changes
  useEffect(() => {
    if (state.address) {
      fetchBalances();

      // Real-time updates every 30 seconds
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      refreshInterval.current = setInterval(fetchBalances, 30000);
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
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
    };
  }, [state.address, fetchBalances]);

  // Watch for network changes when wallet is connected
  useEffect(() => {
    if (!state.isConnected) {
      // Clean up watcher when wallet is disconnected
      if (networkWatcher.current) {
        try {
          networkWatcher.current.stop();
        } catch (error) {
          console.error("Error stopping network watcher:", error);
          trackWalletError({
            action: "wallet.network_watcher.stop_failed",
            error,
            network: state.network,
            address: state.address,
          });
        }
        networkWatcher.current = null;
      }
      return;
    }

    try {
      // Initialize watcher to poll every 3 seconds
      networkWatcher.current = new WatchWalletChanges(3000);

      networkWatcher.current.watch((changes: WalletChangeEvent) => {
        if (changes.error) {
          trackWalletError({
            action: "wallet.change.error",
            error: changes.error,
            network: changes.network || state.network,
            address: changes.address || state.address,
          });
        }

        if (changes.network && changes.network !== state.network) {
          addBreadcrumb({
            category: "wallet",
            message: "wallet.network.changed",
            level: "info",
            data: { from: state.network, to: changes.network },
          });
          setMonitoringUserFromWallet(state.address, changes.network);
          setState((prevState) => ({
            ...prevState,
            network: changes.network,
          }));
        }
      });
    } catch (error) {
      console.error("Failed to initialize network watcher:", error);
      trackWalletError({
        action: "wallet.network_watcher.start_failed",
        error,
        network: state.network,
        address: state.address,
      });
    }

    // Cleanup function
    return () => {
      if (networkWatcher.current) {
        try {
          networkWatcher.current.stop();
        } catch (error) {
          console.error("Error stopping network watcher:", error);
          trackWalletError({
            action: "wallet.network_watcher.stop_failed",
            error,
            network: state.network,
            address: state.address,
          });
        }
        networkWatcher.current = null;
      }
    };
  }, [state.address, state.isConnected, state.network]);

  const connect = useCallback(async () => {
    addBreadcrumb({ category: "wallet", message: "wallet.connect.started", level: "info" });
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const accessResult = await requestAccess();
      if (accessResult?.error) {
        trackWalletError({
          action: "wallet.connect.rejected",
          error: new Error(accessResult.error),
        });
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
      if (addrResult?.address) {
        setMonitoringUserFromWallet(addrResult.address, netResult?.network ?? null);
        addBreadcrumb({
          category: "wallet",
          message: "wallet.connect.succeeded",
          level: "info",
          data: {
            network: netResult?.network ?? null,
            walletAddressMasked: maskWalletAddress(addrResult.address),
          },
        });
      }
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
      trackWalletError({
        action: "wallet.connect.failed",
        error: err,
      });
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    addBreadcrumb({
      category: "wallet",
      message: "wallet.disconnect",
      level: "info",
      data: { network: state.network, walletAddressMasked: maskWalletAddress(state.address) },
    });
    clearMonitoringUser();
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
  }, [state.address, state.network]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, fetchBalances }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
