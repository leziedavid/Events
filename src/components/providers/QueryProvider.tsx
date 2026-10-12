"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DB_EVENT } from "@/lib/storage";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }),
  );

  // « Temps réel » de la démo : DB_EVENT signale une écriture dans cet onglet, `storage`
  // une écriture faite dans un autre onglet (ex. un agent qui valide une entrée pendant
  // que le tableau de bord est ouvert à côté). Sera remplacé par socket.io.
  useEffect(() => {
    const refresh = () => void client.invalidateQueries();
    window.addEventListener(DB_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DB_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
