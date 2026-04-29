import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "../context/WalletContext";
import { useWallet } from "../context/WalletContext";

// Mock @stellar/freighter-api
jest.mock("@stellar/freighter-api", () => ({
  isConnected: jest.fn().mockResolvedValue({ isConnected: false }),
  getAddress: jest.fn().mockResolvedValue({ address: "GABC123TEST456" }),
  getNetwork: jest.fn().mockResolvedValue({ network: "TESTNET" }),
  requestAccess: jest.fn().mockResolvedValue({ error: null }),
  WatchWalletChanges: jest.fn().mockImplementation(() => ({
    watch: jest.fn(),
    stop: jest.fn(),
  })),
}));

// Mock @stellar/stellar-sdk Horizon
jest.mock("@stellar/stellar-sdk", () => ({
  Horizon: {
    Server: jest.fn().mockImplementation(() => ({
      loadAccount: jest.fn().mockResolvedValue({
        balances: [
          {
            asset_type: "native",
            balance: "100.0000000",
            asset_code: undefined,
            asset_issuer: undefined,
          },
        ],
      }),
    })),
  },
}));

// Mock fetch for CoinGecko price API
global.fetch = jest.fn().mockResolvedValue({
  json: async () => ({ stellar: { usd: 0.1 } }),
  ok: true,
} as any);

function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  );
}

// Consumer component to test context values
function WalletConsumer() {
  const wallet = useWallet();
  return (
    <div>
      <span data-testid="connected">
        {wallet.isConnected ? "connected" : "disconnected"}
      </span>
      <span data-testid="address">{wallet.address ?? "no-address"}</span>
      <span data-testid="loading">{wallet.isLoading ? "loading" : "idle"}</span>
      <button onClick={wallet.connect}>Connect</button>
      <button onClick={wallet.disconnect}>Disconnect</button>
      <button onClick={wallet.fetchBalances}>Refresh balances</button>
    </div>
  );
}

function renderWallet() {
  return render(
    <TestProviders>
      <WalletConsumer />
    </TestProviders>,
  );
}

describe("WalletContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: not connected
    const freighter = require("@stellar/freighter-api");
    freighter.isConnected.mockResolvedValue({ isConnected: false });
    freighter.requestAccess.mockResolvedValue({ error: null });
    freighter.getAddress.mockResolvedValue({ address: "GABC123TEST456" });
    freighter.getNetwork.mockResolvedValue({ network: "TESTNET" });
  });

  it("renders children without crashing", () => {
    renderWallet();
    expect(screen.getByTestId("connected")).toBeInTheDocument();
  });

  it("starts in disconnected state", async () => {
    renderWallet();
    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("disconnected");
    });
  });

  it("throws when useWallet is used outside WalletProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    function BadComponent() {
      useWallet();
      return <div />;
    }

    expect(() => render(<BadComponent />)).toThrow(
      "useWallet must be used within WalletProvider",
    );
    consoleSpy.mockRestore();
  });

  it("connects wallet and updates state", async () => {
    renderWallet();

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("address")).toHaveTextContent("GABC123TEST456");
      expect(screen.getByTestId("connected")).toHaveTextContent("connected");
    });
  });

  it("reuses cached price data across balance refreshes", async () => {
    renderWallet();

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("connected");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      screen.getByText("Refresh balances").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("connected");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("disconnects wallet and resets state", async () => {
    renderWallet();

    // Connect first
    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("connected");
    });

    // Then disconnect
    act(() => {
      screen.getByText("Disconnect").click();
    });

    expect(screen.getByTestId("connected")).toHaveTextContent("disconnected");
    expect(screen.getByTestId("address")).toHaveTextContent("no-address");
  });

  it("handles connection error gracefully", async () => {
    const freighter = require("@stellar/freighter-api");
    freighter.requestAccess.mockResolvedValue({ error: "User rejected" });

    renderWallet();

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("disconnected");
    });
  });

  it("restores session if wallet was previously connected", async () => {
    const freighter = require("@stellar/freighter-api");
    freighter.isConnected.mockResolvedValue({ isConnected: true });
    freighter.getAddress.mockResolvedValue({ address: "GPREVIOUSADDR" });

    renderWallet();

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("connected");
    });
  });
});
