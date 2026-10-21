"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Toute écriture réussie rafraîchit l'ensemble des données affichées : une seule règle,
  // pas d'invalidation à maintenir écran par écran (même principe que la démonstration).
  const [client] = useState(() => {
    const queryClient: QueryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } },
      mutationCache: new MutationCache({ onSuccess: () => void queryClient.invalidateQueries() }),
    });
    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
