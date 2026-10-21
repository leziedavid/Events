// Le code d'invitation, la signature du QR Code (HMAC, secret serveur) et la limite de débit
// sont gérés par l'API event-backend. Il ne reste ici que la comparaison des téléphones, utile
// à la recherche dans la liste des invités.

/** Clé de comparaison des numéros : « +225 07 08 09 10 11 » et « 0708091011 » sont un doublon */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 && digits.startsWith("225") ? digits.slice(3) : digits;
}
