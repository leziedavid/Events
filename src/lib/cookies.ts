// Lecture et écriture des cookies côté navigateur (repris de in-seach/src/lib/cookies.ts)

export const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(";").shift() ?? "") || undefined;
  return undefined;
};

/** `maxAgeSeconds` absent = cookie de session (effacé à la fermeture du navigateur) */
export const setCookie = (name: string, value: string, maxAgeSeconds?: number) => {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : "";
  const maxAge = maxAgeSeconds ? `; max-age=${maxAgeSeconds}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${maxAge}; samesite=lax${secure}`;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};
