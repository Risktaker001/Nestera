# Wallet Connection UX Improvements - Integration Guide

## Overview

This guide explains the enhanced wallet connection features in Nestera that properly persist connection state and handle reconnection scenarios.

## Key Features

### 1. **Improved Session Restoration**
- Wallet connection state persists across page refreshes
- Last connected network is saved to localStorage
- Automatic restoration on app load

### 2. **Wallet Disconnection Detection**
- Continuous monitoring for wallet disconnection from the Freighter extension
- Detects when wallet is locked
- Identifies network issues

### 3. **Reconnection Flow**
- Automatic and manual reconnection options
- Handles locked wallet scenarios
- Network preference restoration

### 4. **Connection State Tracking**
Detailed connection status with these states:
- `idle` - Initial state, not connected
- `connecting` - Connection attempt in progress
- `connected` - Successfully connected
- `disconnected` - Wallet was disconnected
- `locked` - Wallet is locked in extension
- `error` - Connection error occurred

### 5. **Timeout Handling**
- 10-second connection timeout
- Prevents hanging on non-responsive wallets
- Clear error messages for timeout scenarios

## Components

### `WalletContext` Improvements

Located in `/frontend/app/context/WalletContext.tsx`

New context values available:

```typescript
interface WalletContextValue {
  // Existing values
  address: string | null;
  network: string | null;
  isConnected: boolean;
  isLoading: boolean;
  balances: Balance[];
  
  // New values
  connectionStatus: "idle" | "connecting" | "connected" | "disconnected" | "locked" | "error";
  isWalletLocked: boolean;
  hasConnectionIssue: boolean;
  lastConnectedNetwork: string | null;
  error: string | null;
  
  // New methods
  reconnect(): Promise<void>;
  clearError(): void;
}
```

**New State Properties:**
- `connectionStatus` - Detailed connection state
- `isWalletLocked` - Whether wallet is locked
- `hasConnectionIssue` - Network or extension issues detected
- `lastConnectedNetwork` - User's preferred network

**New Methods:**
- `reconnect()` - Manually reconnect to wallet
- `clearError()` - Clear error messages

### `ConnectionStatusIndicator` Component

Location: `/frontend/app/components/wallet/ConnectionStatusIndicator.tsx`

Displays wallet connection status with visual indicators.

**Features:**
- Color-coded status display
- Auto-updating status
- Reconnect button when appropriate
- Error message display
- Loading state

**Usage:**

```typescript
import { ConnectionStatusIndicator } from "@/components/wallet/ConnectionStatusIndicator";

export function MyComponent() {
  return (
    <div>
      <ConnectionStatusIndicator />
    </div>
  );
}
```

### `ReconnectButton` Component

Location: `/frontend/app/components/wallet/ReconnectButton.tsx`

Standalone reconnect button for UI integration.

**Features:**
- Shows only when needed
- Different styling for locked vs disconnected
- Handles loading state
- Accessible labels

**Usage:**

```typescript
import { ReconnectButton } from "@/components/wallet/ReconnectButton";

export function TopNav() {
  return (
    <nav>
      <ReconnectButton />
      {/* Other nav items */}
    </nav>
  );
}
```

## Usage Examples

### Basic Wallet Connection

```typescript
import { useWallet } from "@/context/WalletContext";

function WalletButton() {
  const { isConnected, connect, disconnect, isLoading } = useWallet();
  
  if (!isConnected) {
    return (
      <button onClick={connect} disabled={isLoading}>
        Connect Wallet
      </button>
    );
  }
  
  return (
    <button onClick={disconnect}>
      Disconnect
    </button>
  );
}
```

### Handling Connection Issues

```typescript
import { useWallet } from "@/context/WalletContext";
import { ReconnectButton } from "@/components/wallet/ReconnectButton";

function WalletStatus() {
  const { 
    connectionStatus, 
    error, 
    hasConnectionIssue, 
    isWalletLocked,
    clearError 
  } = useWallet();

  if (hasConnectionIssue) {
    return (
      <div className="error-panel">
        <p>Connection Issue: {error}</p>
        <ReconnectButton />
        <button onClick={clearError}>Dismiss</button>
      </div>
    );
  }

  return null;
}
```

### Displaying Connection Status

```typescript
import { useWallet } from "@/context/WalletContext";

function StatusDisplay() {
  const { connectionStatus, network, address } = useWallet();

  return (
    <div>
      <p>Status: {connectionStatus}</p>
      <p>Network: {network}</p>
      <p>Address: {address}</p>
    </div>
  );
}
```

### Persisting Network Preference

The network preference is automatically saved and restored. This happens in the background without additional code needed.

## How It Works

### Session Restoration Flow

1. App loads
2. `WalletContext` initializes and checks if wallet was previously connected
3. If connected, retrieves saved network preference from localStorage
4. Calls `isConnected()` to verify wallet is still connected
5. If connected, restores address and network information
6. Balances are fetched automatically

### Disconnection Detection Flow

1. After connection, a 15-second interval checks for disconnection
2. Uses `isConnected()` from Freighter API to verify connection
3. If disconnection detected, sets `hasConnectionIssue: true`
4. Updates `connectionStatus` to "disconnected" or "locked"
5. User is prompted to reconnect

### Reconnection Flow

1. User clicks "Reconnect" button or manually calls `reconnect()`
2. Sets `connectionStatus` to "connecting"
3. Checks if wallet is now available
4. If available, requests access and restores connection
5. Restores saved network preference if available
6. Fetches balances
7. Updates `connectionStatus` to "connected"

### Network Preference Persistence

- Every time network changes, it's saved to `localStorage` key `nestera_last_network`
- On app load, saved preference is used if current connection doesn't have network info
- Survives across browser sessions

### Timeout Handling

- Connection attempts timeout after 10 seconds
- Prevents app hanging if Freighter extension is unresponsive
- Clear error message indicates timeout occurred
- User can retry with "Reconnect" button

## Error Handling

The context provides detailed error messages for different scenarios:

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Wallet locked | "Wallet is locked. Please unlock in Freighter extension." | Show "🔓 Unlock" button |
| Connection timeout | "Connection timeout. Ensure Freighter is installed and responding." | Show "Reconnect" button |
| User rejected | "Connection rejected" | Show "Connect" button again |
| Network error | Specific error message | Show "Reconnect" button |
| Disconnected | "Wallet disconnected. Click Reconnect to restore connection." | Show "Reconnect" button |

## Network Switching Handling

When user switches networks in Freighter:

1. Network change is detected by `WatchWalletChanges`
2. New network is saved to localStorage
3. `network` state is updated
4. Balances are refetched for new network
5. UI automatically reflects network change

## Testing

See [`WalletContext.test.tsx`](./app/__tests__/WalletContext.test.tsx) for comprehensive tests:

- Session restoration
- Network persistence
- Disconnection detection
- Reconnection flow
- Locked wallet handling
- Error handling
- Connection status transitions

Run tests with:
```bash
npm test
```

## Best Practices

1. **Use `ConnectionStatusIndicator`** - Shows users the connection status clearly
2. **Provide `ReconnectButton`** - Makes it easy to recover from disconnections
3. **Listen to `error` state** - Display error messages to users
4. **Check `connectionStatus`** - Don't assume `isConnected` gives full picture
5. **Call `clearError()`** - Let users dismiss error messages
6. **Handle network changes** - UI updates automatically but test interactions

## Integration Checklist

- [ ] WalletContext is updated with new state and methods
- [ ] ConnectionStatusIndicator component exists
- [ ] ReconnectButton component exists
- [ ] TopNav or Dashboard displays connection status
- [ ] Tests are updated and passing
- [ ] Network preference persistence is working
- [ ] Reconnection flow is tested manually
- [ ] Locked wallet handling is tested
- [ ] Timeout handling is tested
- [ ] Console has no connection-related errors

## Troubleshooting

### Connection always shows as disconnected
- Check if Freighter extension is installed
- Verify wallet is unlocked in Freighter
- Check browser console for errors
- Try manual reconnect

### Network preference not saving
- Verify localStorage is enabled in browser
- Check for localStorage quota issues
- Look for errors in browser console

### Reconnect button not showing
- Check that `hasConnectionIssue` or `connectionStatus` is set correctly
- Verify `ReconnectButton` is placed in visible part of UI
- Check browser console for component errors

### Timeout errors frequently appearing
- Check if Freighter extension is responsive
- Try restarting browser and Freighter
- Check internet connection
- Verify Stellar RPC endpoints are responsive

## Performance Considerations

- Disconnection check runs every 15 seconds (configurable)
- Balance refresh every 30 seconds (configurable)
- Network watcher polls every 3 seconds (from Freighter API)
- All async operations are properly debounced
- Timers are cleaned up on component unmount

## Security Considerations

- Never store sensitive wallet data
- Network preference only stores network name (not keys/secrets)
- Connection timeout prevents indefinite waiting
- Error messages don't expose sensitive information
- localStorage data is domain-specific
