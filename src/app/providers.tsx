// src/app/providers.tsx

"use client";

import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { WatchedDataProvider } from "@/contexts/WatchedDataContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WatchlistProvider>
      <WatchedDataProvider>
        {children}
      </WatchedDataProvider>
    </WatchlistProvider>
  );
}