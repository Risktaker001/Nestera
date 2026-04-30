"use client";

import React, { useCallback, useState } from "react";
import { useWallet } from "../../context/WalletContext";

/**
 * ReconnectButton Component
 *
 * Provides a button to manually reconnect wallet when disconnection is detected.
 * Shows only when appropriate (disconnected, locked, or connection issue).
 */
export function ReconnectButton() {
    const {
        isConnected,
        connectionStatus,
        isWalletLocked,
        hasConnectionIssue,
        isLoading,
        reconnect,
    } = useWallet();

    const [isReconnecting, setIsReconnecting] = useState(false);

    const handleReconnect = useCallback(async () => {
        setIsReconnecting(true);
        try {
            await reconnect();
        } finally {
            setIsReconnecting(false);
        }
    }, [reconnect]);

    // Show button if disconnected, locked, or has connection issues
    const shouldShow =
        !isConnected ||
        connectionStatus === "disconnected" ||
        isWalletLocked ||
        hasConnectionIssue;

    if (!shouldShow) {
        return null;
    }

    const isLoading_state = isLoading || isReconnecting;

    return (
        <button
            onClick={handleReconnect}
            disabled={isLoading_state}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isLoading_state
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isWalletLocked
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
            title={
                isWalletLocked
                    ? "Click to reconnect and unlock wallet"
                    : "Click to restore wallet connection"
            }
        >
            {isLoading_state ? (
                <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Reconnecting...
                </>
            ) : isWalletLocked ? (
                "🔓 Unlock Wallet"
            ) : (
                "🔄 Reconnect"
            )}
        </button>
    );
}

export default ReconnectButton;
