"use client";

// Hooks React Query au-dessus de `src/api`. Aucune invalidation manuelle : chaque mutation
// réussie rafraîchit toutes les requêtes (QueryProvider, MutationCache). Les vues « en
// direct » (capacité, invités, entrées) se rafraîchissent en plus à intervalle régulier,
// pour suivre ce que font les autres appareils (agents à l'entrée, invités qui confirment).

import { useMutation, useQuery } from "@tanstack/react-query";
import { hasStaffSession } from "@/api/api";
import { createAccount, deleteAccount, getAccounts, setAccountPassword, updateAccount } from "@/api/accounts-api";
import { addGuestbookMessage, deleteGuestbookMessage, getGuestbook, getReminders, sendReminder } from "@/api/guestbook-api";
import { clearAllData, createRsvp, deleteRsvp, findRsvp, getCapacity, getRsvpByCode, getRsvps, getTableOptions, getTables, regenerateCard, renameTable, restoreRsvp, revokeRsvp, updateRsvp } from "@/api/rsvp-api";
import { createMenuItem, deleteMenuItem, getMenu, updateMenuItem } from "@/api/menu-api";
import { getSettings, reassignTables, updateSettings } from "@/api/settings-api";
import { getScans, getScanStats, lookupInvitation, validateEntry } from "@/api/scan-api";
import { defaultEvent, defaultHome, defaultSettings, resolveQrTarget } from "@/config/wedding";
import { tableLabel } from "@/lib/utils";
import type { AccountInput, GuestbookInput, MenuItemInput, NewAccountInput, ReminderInput } from "@/lib/schemas";
import type { BaseResponse, EventInfo, EventSettings, HomeSections, QrKind, RsvpInput, ScanSource } from "@/types/interface";

/** Transforme une réponse en erreur lançable, pour profiter de onError / isError */
async function unwrap<T>(promise: Promise<BaseResponse<T>>): Promise<T> {
  let res: BaseResponse<T>;
  try {
    res = await promise;
  } catch {
    // fetch rejette sans réponse : réseau coupé, API injoignable ou bloquée (CORS)
    throw new Error("Connexion au serveur impossible. Vérifiez votre connexion internet.");
  }
  if (res.statusCode >= 400 || res.data === undefined) throw new Error(res.message || "Une erreur est survenue.");
  return res.data;
}

export const queryKeys = {
  capacity: ["capacity"] as const,
  rsvps: ["rsvps"] as const,
  rsvp: (code: string) => ["rsvp", code] as const,
  tables: ["tables"] as const,
  scans: ["scans"] as const,
  guestbook: ["guestbook"] as const,
  reminders: ["reminders"] as const,
  settings: ["settings"] as const,
  accounts: ["accounts"] as const,
  scanStats: ["scan-stats"] as const,
  tableOptions: (excludeId?: string, categorie?: string) => ["table-options", excludeId ?? "", categorie ?? ""] as const,
  menu: ["menu"] as const,
};

/** Rafraîchissement des vues suivies en direct (le jour J, les entrées s'enchaînent) */
const LIVE = 15_000;

export const useCapacity = () => useQuery({ queryKey: queryKeys.capacity, queryFn: () => unwrap(getCapacity()), refetchInterval: () => (hasStaffSession() ? LIVE : false) });
export const useRsvps = () => useQuery({ queryKey: queryKeys.rsvps, queryFn: () => unwrap(getRsvps()), refetchInterval: LIVE });
export const useRsvp = (code: string) =>
  useQuery({ queryKey: queryKeys.rsvp(code), queryFn: () => unwrap(getRsvpByCode(code)), enabled: !!code, retry: false });
export const useTableOptions = (excludeId?: string, categorie?: string) =>
  useQuery({ queryKey: queryKeys.tableOptions(excludeId, categorie), queryFn: () => unwrap(getTableOptions(excludeId, categorie)) });

/** « Table CAE » à partir du numéro (noms des tables fournis par les réglages) */
export function useTableLabel(): (numero: number) => string {
  const tables = useSettings().data?.tables;
  return (numero: number) => tableLabel(numero, tables);
}

/** Sections de l'accueil (valeurs de départ pendant le chargement, pour éviter les apparitions) */
export function useHomeSections(): HomeSections & { menu: boolean } {
  const settings = useSettings().data;
  return { ...(settings?.home ?? defaultHome), menu: settings?.menu.visible ?? defaultSettings.menu.visible };
}

/**
 * Adresse encodée dans un QR Code de la plateforme (modifiable dans /admin?tab=qr-codes).
 * Vide pendant le rendu serveur : l'adresse du site n'est connue que dans le navigateur.
 */
export function useQrUrl(kind: Exclude<QrKind, "custom">): string {
  const entry = (useSettings().data?.qrCodes ?? defaultSettings.qrCodes).find((q) => q.kind === kind);
  if (typeof window === "undefined" || !entry) return "";
  return resolveQrTarget(entry.target, window.location.origin);
}

export const useTables = () => useQuery({ queryKey: queryKeys.tables, queryFn: () => unwrap(getTables()) });
export const useScans = () => useQuery({ queryKey: queryKeys.scans, queryFn: () => unwrap(getScans()), refetchInterval: LIVE });
export const useScanStats = () => useQuery({ queryKey: queryKeys.scanStats, queryFn: () => unwrap(getScanStats()), refetchInterval: LIVE });
export const useGuestbook = () => useQuery({ queryKey: queryKeys.guestbook, queryFn: () => unwrap(getGuestbook()) });
export const useReminders = () => useQuery({ queryKey: queryKeys.reminders, queryFn: () => unwrap(getReminders()) });

export const useSettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: () => unwrap(getSettings()) });

/**
 * Noms, date et lieu du mariage. Renvoie les valeurs de départ pendant le rendu serveur et le
 * premier chargement, puis celles enregistrées par l'organisateur.
 */
export function useEventInfo(): EventInfo {
  return useSettings().data?.event ?? defaultEvent;
}

export const useUpdateSettings = () => useMutation({ mutationFn: (patch: Partial<EventSettings>) => unwrap(updateSettings(patch)) });
export const useReassignTables = () => useMutation({ mutationFn: () => unwrap(reassignTables()) });
export const useRenameTable = () =>
  useMutation({ mutationFn: ({ numero, name }: { numero: number; name: string }) => unwrap(renameTable(numero, name)) });
export const useRevokeRsvp = () => useMutation({ mutationFn: (id: string) => unwrap(revokeRsvp(id)) });
export const useRestoreRsvp = () => useMutation({ mutationFn: (id: string) => unwrap(restoreRsvp(id)) });
export const useRegenerateCard = () => useMutation({ mutationFn: (id: string) => unwrap(regenerateCard(id)) });

export const useCreateRsvp = (options?: { asAdmin?: boolean }) =>
  useMutation({ mutationFn: (input: RsvpInput) => unwrap(createRsvp(input, options)) });
export const useUpdateRsvp = () =>
  useMutation({ mutationFn: ({ id, input }: { id: string; input: RsvpInput }) => unwrap(updateRsvp(id, input)) });
export const useDeleteRsvp = () => useMutation({ mutationFn: (id: string) => unwrap(deleteRsvp(id)) });
export const useMenu = () => useQuery({ queryKey: queryKeys.menu, queryFn: () => unwrap(getMenu()) });
export const useCreateMenuItem = () => useMutation({ mutationFn: (input: MenuItemInput) => unwrap(createMenuItem(input)) });
export const useUpdateMenuItem = () =>
  useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<MenuItemInput> & { visible?: boolean } }) => unwrap(updateMenuItem(id, patch)) });
export const useDeleteMenuItem = () => useMutation({ mutationFn: (id: string) => unwrap(deleteMenuItem(id)) });

export const useFindRsvp = () => useMutation({ mutationFn: (query: string) => unwrap(findRsvp(query)) });
export const useAccounts = () => useQuery({ queryKey: queryKeys.accounts, queryFn: () => unwrap(getAccounts()) });
export const useCreateAccount = () => useMutation({ mutationFn: (input: NewAccountInput) => unwrap(createAccount(input)) });
export const useUpdateAccount = () =>
  useMutation({ mutationFn: ({ id, input }: { id: string; input: AccountInput & { active: boolean } }) => unwrap(updateAccount(id, input)) });
export const useSetAccountPassword = () =>
  useMutation({ mutationFn: ({ id, password }: { id: string; password: string }) => unwrap(setAccountPassword(id, password)) });
export const useDeleteAccount = () => useMutation({ mutationFn: (id: string) => unwrap(deleteAccount(id)) });

export const useClearData = () => useMutation({ mutationFn: () => unwrap(clearAllData()) });

export const useLookupInvitation = () =>
  useMutation({
    mutationFn: ({ raw, source }: { raw: string; source: ScanSource }) => unwrap(lookupInvitation(raw, source)),
  });
export const useValidateEntry = () =>
  useMutation({
    mutationFn: ({ guestId, source }: { guestId: string; source: ScanSource }) => unwrap(validateEntry(guestId, source)),
  });

export const useAddGuestbookMessage = () => useMutation({ mutationFn: (input: GuestbookInput) => unwrap(addGuestbookMessage(input)) });
export const useDeleteGuestbookMessage = () => useMutation({ mutationFn: (id: string) => unwrap(deleteGuestbookMessage(id)) });
export const useSendReminder = () => useMutation({ mutationFn: (input: ReminderInput) => unwrap(sendReminder(input)) });
