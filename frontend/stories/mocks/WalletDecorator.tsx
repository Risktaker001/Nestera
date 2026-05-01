import React from "react";
import { WalletContext } from "../../app/context/WalletContext";

export const WalletDecorator = (Story: any) => {
  const mockValue = {
    address: "GC3H...4K9L",
    network: "PUBLIC",
    isConnected: true,
    connectionStatus: "connected" as const,
    isLoading: false,
    isBalancesLoading: false,
    error: null,
    balanceError: null,
    balances: [
      { asset_code: "XLM", balance: "1000.00", asset_type: "native", usd_value: 120.0 },
      { asset_code: "USDC", balance: "500.00", asset_type: "credit_alphanum4", asset_issuer: "G...", usd_value: 500.0 },
    ],
    totalUsdValue: 620.0,
    lastBalanceSync: Date.now(),
    lastConnectedNetwork: "PUBLIC",
    isWalletLocked: false,
    hasConnectionIssue: false,
    connect: async () => {},
    disconnect: () => {},
    fetchBalances: async () => {},
    reconnect: async () => {},
    clearError: () => {},
  };

  return (
    <WalletContext.Provider value={mockValue}>
      <Story />
    </WalletContext.Provider>
  );
};
