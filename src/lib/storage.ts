// Base locale de démonstration : tout est sérialisé dans une seule clé localStorage.
// Seuls les fichiers `src/api/*` l'utilisent ; ce sont eux qui appelleront le backend plus tard.

import { defaultEvent, defaultSettings } from "@/config/wedding";
import { buildDefaultMenu } from "@/data/menu";
import { buildDefaultAccounts, buildSeedDb } from "@/data/seed";
import type { BaseResponse, LocalDb } from "@/types/interface";

// Changer le suffixe quand les valeurs de départ changent : chaque navigateur repart alors
// d'une base neuve au lieu de garder ses anciennes données de démonstration.
const DB_KEY = "mariage-db-v5";
const OLD_KEYS = ["mariage-db-v1", "mariage-db-v2", "mariage-db-v3", "mariage-db-v4"];

/** Émis à chaque écriture : QueryProvider s'en sert pour rafraîchir toutes les requêtes */
export const DB_EVENT = "mariage-db-change";

const EMPTY: LocalDb = { guests: [], scans: [], guestbook: [], reminders: [], menu: [], accounts: [], settings: defaultSettings };

export function readDb(): LocalDb {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      // Fusion avec les valeurs par défaut : une base enregistrée par une version précédente
      // de la démo n'a pas forcément tous les champs
      const parsed = JSON.parse(raw) as Partial<LocalDb>;
      const settings = {
        ...defaultSettings,
        ...parsed.settings,
        event: { ...defaultEvent, ...parsed.settings?.event },
        menu: { ...defaultSettings.menu, ...parsed.settings?.menu },
        home: { ...defaultSettings.home, ...parsed.settings?.home },
        dressCode: { ...defaultSettings.dressCode, ...parsed.settings?.dressCode },
        ceremony: { ...defaultSettings.ceremony, ...parsed.settings?.ceremony },
        story: { ...defaultSettings.story, ...parsed.settings?.story },
      };
      // `menu` absent = base antérieure à la fonction : on lui donne le menu de démonstration
      // `accounts` absent = base antérieure à la gestion des comptes : comptes de démonstration
      return { ...EMPTY, ...parsed, menu: parsed.menu ?? buildDefaultMenu(), accounts: parsed.accounts ?? buildDefaultAccounts(), settings };
    }
  } catch {
    // JSON corrompu ou stockage indisponible : on repart des données de démonstration
  }
  const db = buildSeedDb();
  try {
    OLD_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Stockage indisponible : rien à nettoyer
  }
  writeDb(db);
  return db;
}

/**
 * Enregistre la base. Renvoie `false` si le navigateur a refusé (quota dépassé, navigation
 * privée) : les API qui écrivent de gros volumes, comme une photo, doivent le signaler.
 */
export function writeDb(db: LocalDb): boolean {
  if (typeof window === "undefined") return false;
  let saved = true;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    saved = false;
  }
  window.dispatchEvent(new Event(DB_EVENT));
  return saved;
}

export function resetDb(): void {
  writeDb(buildSeedDb());
}

/** Latence artificielle : rend visibles les états de chargement, comme avec un vrai réseau */
export const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const ok = <T>(data: T, message = "OK"): BaseResponse<T> => ({ statusCode: 200, message, data });
export const fail = <T>(statusCode: number, message: string): BaseResponse<T> => ({ statusCode, message });
