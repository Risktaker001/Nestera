"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState } from "react";

// 5 minutes in ms — max age for persisted cache
const CACHE_MAX_AGE = 1000 * 60 * 5;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,       // 30s before considered stale
        gcTime: CACHE_MAX_AGE,   // 5 min before garbage collected
        refetchOnWindowFocus: true,
        retry: 2,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  // Only create persister on the client (localStorage is not available on server)
  const persister =
    typeof window !== "undefined"
      ? createSyncStoragePersister({
          storage: window.localStorage,
          key: "nestera-query-cache",
          throttleTime: 1000,
        })
      : undefined;

  if (!persister) {
    // SSR fallback — no persistence
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: createSyncStoragePersister({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }), maxAge: CACHE_MAX_AGE }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
