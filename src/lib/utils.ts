import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Rsvp } from "@/types/interface";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** « Famille Kouassi » pour une famille, le nom tel quel sinon */
export function displayName(guest: Pick<Rsvp, "nom" | "categorie">): string {
  if (guest.categorie === "FAMILLE" && !/^famille\b/i.test(guest.nom)) return `Famille ${guest.nom}`;
  return guest.nom;
}

/** « Table CAE », « Table VIP 1 », « Table 16 » : le nom de la table, sinon son numéro */
export function tableLabel(numero: number, tables?: { numero: number; name: string }[]): string {
  const name = tables?.find((t) => t.numero === numero)?.name?.trim();
  if (!name) return `Table ${numero}`;
  return /^table\b/i.test(name) ? name : `Table ${name}`;
}

export function personnes(n: number): string {
  return `${n} personne${n > 1 ? "s" : ""}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** Heure d'entrée façon « 18h42 » */
export function formatHour(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(":", "h");
}
