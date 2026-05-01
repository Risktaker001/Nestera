"use client";

import React, { useEffect, useMemo, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  QUERY_CACHE_MAX_AGE,
  QUERY_PERSIST_KEY,
  trimQueryCache,
} from "@/app/lib/query";

const memoryStorage = new Map<string, string>();

const safeStorage = {
  getItem(key: string) {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(key);
    }

    return memoryStorage.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
      return;
    }

    memoryStorage.set(key, value);
  },
  removeItem(key: string) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
      return;
    }

    memoryStorage.delete(key);
  },
};

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 15 * 60_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchIntervalInBackground: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  const persister = useMemo(
    () =>
      createSyncStoragePersister({
        storage: safeStorage,
        key: QUERY_PERSIST_KEY,
        throttleTime: 1000,
      }),
    [],
  );

  useEffect(() => {
    trimQueryCache(queryClient);

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      trimQueryCache(queryClient);
    });

    return unsubscribe;
  }, [queryClient]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: QUERY_CACHE_MAX_AGE,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
