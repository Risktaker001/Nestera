"use client";

import React, { useCallback } from "react";
import { useWallet } from "../../context/WalletContext";

/**
 * ConnectionStatusIndicator Component
 *
 * Displays the current wallet connection status and provides actions
 * to reconnect or clear error messages.
 *
 * Features:
 * - Visual status indicator (idle, connecting, connected, disconnected, locked, error)
 * - Error message display with dismiss option
 * - Reconnect button when connection is lost
 * - Network preference indication
 * - Loading state feedback
 */
export function ConnectionStatusIndicator() {
    const {
        connectionStatus,
        isConnected,
        error,
        isLoading,
        network,
        isWalletLocked,
        hasConnectionIssue,
        reconnect,
        clearError,
    } = useWallet();

    const handleReconnect = useCallback(async () => {
        await reconnect();
    }, [reconnect]);

    const handleDismissError = useCallback(() => {
        clearError();
    }, [clearError]);

    // Determine status color and label
    const getStatusDisplay = () => {
        switch (connectionStatus) {
            case "connected":
                return {
                    color: "bg-green-100 border-green-300",
                    textColor: "text-green-700",
                    label: "Connected",
                    icon: "✓",
                };
            case "connecting":
                return {
                    color: "bg-blue-100 border-blue-300",
                    textColor: "text-blue-700",
                    label: "Connecting...",
                    icon: "⟳",
                };
            case "disconnected":
                return {
                    color: "bg-yellow-100 border-yellow-300",
                    textColor: "text-yellow-700",
                    label: "Disconnected",
                    icon: "⊘",
                };
            case "locked":
                return {
                    color: "bg-orange-100 border-orange-300",
                    textColor: "text-orange-700",
                    label: "Wallet Locked",
                    icon: "🔒",
                };
            case "error":
                return {
                    color: "bg-red-100 border-red-300",
                    textColor: "text-red-700",
                    label: "Error",
                    icon: "⚠",
                };
            default:
                return {
                    color: "bg-gray-100 border-gray-300",
                    textColor: "text-gray-700",
                    label: "Idle",
                    icon: "−",
                };
        }
    };

    const status = getStatusDisplay();

    // Only show if there's an active issue or we're in a non-idle state
    if (
        !isConnected &&
        connectionStatus === "idle" &&
        !error &&
        !hasConnectionIssue
    ) {
        return null;
    }

    return (
        <div className="w-full max-w-md">
            {/* Main status card */}
            <div
                className={`border-2 rounded-lg p-4 ${status.color} ${isLoading ? "opacity-75" : ""
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span
                            className={`text-xl ${connectionStatus === "connecting" ? "animate-spin" : ""
                                }`}
                        >
                            {status.icon}
                        </span>
                        <div>
                            <p className={`text-sm font-semibold ${status.textColor}`}>
                                {status.label}
                            </p>
                            {isConnected && network && (
                                <p className={`text-xs ${status.textColor} opacity-75`}>
                                    Network: {network}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        {(isWalletLocked || hasConnectionIssue) && !isLoading && (
                            <button
                                onClick={handleReconnect}
                                className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                                disabled={isLoading}
                            >
                                Reconnect
                            </button>
                        )}
                        {error && (
                            <button
                                onClick={handleDismissError}
                                className="px-3 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium transition-colors"
                                disabled={isLoading}
                            >
                                Dismiss
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <p>{error}</p>
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse w-1/3"></div>
                </div>
            )}
        </div>
    );
}

export default ConnectionStatusIndicator;
