// Codes d'invitation et signature du QR Code.
//
// DÉMO : la signature est calculée dans le navigateur avec un sel public, elle ne protège donc
// que des fautes de frappe et des QR Codes fabriqués au hasard. Avec le backend NestJS, elle
// sera remplacée par un HMAC-SHA256 dont le secret reste côté serveur — le format
// « CODE.SIGNATURE » ne changera pas.

// Sans 0/O ni 1/I/L : le code doit pouvoir être dicté ou recopié à l'entrée sans ambiguïté
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DEMO_SALT = "mariage-demo-2026";

/** Hachage 53 bits (cyrb53) : synchrone et suffisant pour une démonstration */
export function hash53(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function formatCode(chars: string): string {
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

/** Code reproductible (données de démonstration) */
export function codeFromSeed(seed: string): string {
  let n = hash53(seed);
  let chars = "";
  for (let i = 0; i < 8; i++) {
    chars += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length);
  }
  return formatCode(chars);
}

export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return formatCode(Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join(""));
}

export function signCode(code: string): string {
  return hash53(`${code}:${DEMO_SALT}`).toString(36).toUpperCase().slice(0, 6);
}

/** Contenu du QR Code : uniquement l'identifiant signé, aucune donnée personnelle */
export function buildQrPayload(code: string): string {
  return `${code}.${signCode(code)}`;
}

/**
 * Lit un QR Code scanné ou un code saisi à la main. La saisie manuelle n'a pas de
 * signature (l'agent ne recopie que le code) ; un QR Code, lui, doit être signé.
 */
export function parsePayload(raw: string): { code: string; valid: boolean } {
  const value = raw.trim().toUpperCase();
  if (value.includes(".")) {
    const [code, signature] = value.split(".");
    return { code, valid: signature === signCode(code) };
  }
  const compact = value.replace(/[^A-Z0-9]/g, "");
  return { code: compact.length === 8 ? formatCode(compact) : value, valid: compact.length === 8 };
}

/** Clé de comparaison des numéros : « +225 07 08 09 10 11 » et « 0708091011 » sont un doublon */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 && digits.startsWith("225") ? digits.slice(3) : digits;
}

/**
 * Limite de débit côté navigateur (fenêtre glissante). Simple garde-fou de démo :
 * la vraie limite sera appliquée par le backend (ThrottlerGuard).
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  if (typeof window === "undefined") return true;
  const now = Date.now();
  const storageKey = `rate:${key}`;
  let hits: number[] = [];
  try {
    hits = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
  } catch {
    hits = [];
  }
  hits = hits.filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  sessionStorage.setItem(storageKey, JSON.stringify(hits));
  return true;
}
