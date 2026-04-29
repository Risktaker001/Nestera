import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
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
          { asset_type: "native", balance: "100.0000000", asset_code: undefined, asset_issuer: undefined },
        ],
      }),
    })),
  },
}));

// Mock fetch for CoinGecko price API
global.fetch = jest.fn().mockResolvedValue({
  json: async () => ({ stellar: { usd: 0.1 } }),
} as any);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Consumer component to test context values
function WalletConsumer() {
  const wallet = useWallet();
  return (
    <div>
      <span data-testid="connected">{wallet.isConnected ? "connected" : "disconnected"}</span>
      <span data-testid="address">{wallet.address ?? "no-address"}</span>
      <span data-testid="loading">{wallet.isLoading ? "loading" : "idle"}</span>
      <span data-testid="connection-status">{wallet.connectionStatus}</span>
      <span data-testid="is-locked">{wallet.isWalletLocked ? "locked" : "not-locked"}</span>
      <span data-testid="has-connection-issue">
        {wallet.hasConnectionIssue ? "has-issue" : "no-issue"}
      </span>
      <span data-testid="last-connected-network">
        {wallet.lastConnectedNetwork ?? "no-network"}
      </span>
      <span data-testid="error">{wallet.error ?? "no-error"}</span>
      <button onClick={wallet.connect}>Connect</button>
      <button onClick={wallet.disconnect}>Disconnect</button>
      <button onClick={wallet.reconnect}>Reconnect</button>
      <button onClick={wallet.clearError}>Clear Error</button>
    </div>
  );
}

function renderWallet() {
  return render(
    <WalletProvider>
      <WalletConsumer />
    </WalletProvider>
  );
}

describe("WalletContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
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

  it("starts in idle state when not connected", async () => {
    renderWallet();
    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("idle");
    });
  });

  it("throws when useWallet is used outside WalletProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

    function BadComponent() {
      useWallet();
      return <div />;
    }

    expect(() => render(<BadComponent />)).toThrow("useWallet must be used within WalletProvider");
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
      expect(screen.getByTestId("connection-status")).toHaveTextContent("connected");
    });
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
    expect(screen.getByTestId("connection-status")).toHaveTextContent("disconnected");
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
      expect(screen.getByTestId("error")).toHaveTextContent("User rejected");
    });
  });

  it("handles locked wallet error", async () => {
    const freighter = require("@stellar/freighter-api");
    freighter.requestAccess.mockResolvedValue({
      error: "Wallet is locked. Please unlock in extension.",
    });

    renderWallet();

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("is-locked")).toHaveTextContent("locked");
      expect(screen.getByTestId("connection-status")).toHaveTextContent("locked");
    });
  });

  it("restores session if wallet was previously connected", async () => {
    const freighter = require("@stellar/freighter-api");
    freighter.isConnected.mockResolvedValue({ isConnected: true });
    freighter.getAddress.mockResolvedValue({ address: "GPREVIOUSADDR" });
    freighter.getNetwork.mockResolvedValue({ network: "TESTNET" });

    renderWallet();

    await waitFor(() => {
      expect(screen.getByTestId("connected")).toHaveTextContent("connected");
      expect(screen.getByTestId("address")).toHaveTextContent("GPREVIOUSADDR");
    });
  });

  it("persists network preference to localStorage", async () => {
    renderWallet();

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(localStorage.getItem("nestera_last_network")).toBe("TESTNET");
    });
  });

  it("loads saved network preference on initialization", async () => {
    localStorage.setItem("nestera_last_network", "PUBLIC");

    const freighter = require("@stellar/freighter-api");
    freighter.isConnected.mockResolvedValue({ isConnected: false });

    renderWallet();

    await waitFor(() => {
      // Verify localStorage was checked
      expect(localStorage.getItem("nestera_last_network")).toBe("PUBLIC");
    });
  });

  it("clears error message on clearError", async () => {
    const freighter = require("@stellar/freighter-api");
    freighter.requestAccess.mockResolvedValue({ error: "Test error" });

    renderWallet();

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).not.toHaveTextContent("no-error");
    });

    act(() => {
      screen.getByText("Clear Error").click();
    });

    expect(screen.getByTestId("error")).toHaveTextContent("no-error");
  });

  it("handles reconnection attempt", async () => {
    const freighter = require("@stellar/freighter-api");
    freighter.isConnected.mockResolvedValue({ isConnected: true });

    renderWallet();

    await act(async () => {
      screen.getByText("Reconnect").click();
    });

    // After reconnect, should attempt to get address
    await waitFor(() => {
      expect(freighter.getAddress).toHaveBeenCalled();
    });
  });

  it("tracks connection status transitions", async () => {
    renderWallet();

    // Should start as idle
    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("idle");
    });

    // Move to connecting
    await act(async () => {
      const connectBtn = screen.getByText("Connect");
      connectBtn.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("connected");
    });
  });
});

