"use client";

// Hooks React Query au-dessus de `src/api`. Aucune invalidation manuelle : chaque écriture
// de la base locale émet un événement que QueryProvider transforme en rafraîchissement
// général (y compris depuis un autre onglet — utile pour suivre les entrées en direct).

import { useMutation, useQuery } from "@tanstack/react-query";
import { addGuestbookMessage, deleteGuestbookMessage, getGuestbook, getReminders, sendReminder } from "@/api/guestbook-api";
import { clearAllData, createRsvp, deleteRsvp, findRsvp, getCapacity, getRsvpByCode, getRsvps, getTables, resetDemoData, restoreRsvp, revokeRsvp, updateRsvp } from "@/api/rsvp-api";
import { createMenuItem, deleteMenuItem, getMenu, updateMenuItem } from "@/api/menu-api";
import { getSettings, reassignTables, updateSettings } from "@/api/settings-api";
import { getScans, lookupInvitation, validateEntry } from "@/api/scan-api";
import { defaultEvent } from "@/config/wedding";
import type { GuestbookInput, MenuItemInput, ReminderInput } from "@/lib/schemas";
import type { BaseResponse, EventInfo, EventSettings, RsvpInput, ScanSource } from "@/types/interface";

/** Transforme une réponse en erreur lançable, pour profiter de onError / isError */
async function unwrap<T>(promise: Promise<BaseResponse<T>>): Promise<T> {
  const res = await promise;
  if (res.statusCode >= 400 || res.data === undefined) throw new Error(res.message);
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
  menu: ["menu"] as const,
};

export const useCapacity = () => useQuery({ queryKey: queryKeys.capacity, queryFn: () => unwrap(getCapacity()) });
export const useRsvps = () => useQuery({ queryKey: queryKeys.rsvps, queryFn: () => unwrap(getRsvps()) });
export const useRsvp = (code: string) =>
  useQuery({ queryKey: queryKeys.rsvp(code), queryFn: () => unwrap(getRsvpByCode(code)), enabled: !!code, retry: false });
export const useTables = () => useQuery({ queryKey: queryKeys.tables, queryFn: () => unwrap(getTables()) });
export const useScans = () => useQuery({ queryKey: queryKeys.scans, queryFn: () => unwrap(getScans()) });
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
export const useRevokeRsvp = () => useMutation({ mutationFn: (id: string) => unwrap(revokeRsvp(id)) });
export const useRestoreRsvp = () => useMutation({ mutationFn: (id: string) => unwrap(restoreRsvp(id)) });

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
export const useClearData = () => useMutation({ mutationFn: () => unwrap(clearAllData()) });
export const useResetDemo = () => useMutation({ mutationFn: () => unwrap(resetDemoData()) });

export const useLookupInvitation = () =>
  useMutation({
    mutationFn: ({ raw, source, agent }: { raw: string; source: ScanSource; agent: string }) =>
      unwrap(lookupInvitation(raw, source, agent)),
  });
export const useValidateEntry = () =>
  useMutation({
    mutationFn: ({ guestId, source, agent }: { guestId: string; source: ScanSource; agent: string }) =>
      unwrap(validateEntry(guestId, source, agent)),
  });

export const useAddGuestbookMessage = () => useMutation({ mutationFn: (input: GuestbookInput) => unwrap(addGuestbookMessage(input)) });
export const useDeleteGuestbookMessage = () => useMutation({ mutationFn: (id: string) => unwrap(deleteGuestbookMessage(id)) });
export const useSendReminder = () => useMutation({ mutationFn: (input: ReminderInput) => unwrap(sendReminder(input)) });
