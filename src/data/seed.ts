// // Données fictives de démonstration : 78 personnes confirmées, soit « 72 / 150 » places
// // restantes au premier lancement. Elles seront remplacées par la base PostgreSQL.

// import { defaultSettings, wedding } from "@/config/wedding";
// import { buildDefaultMenu } from "@/data/menu";
// import { codeFromSeed } from "@/lib/security";
// import { findTable } from "@/lib/tables";
// import type { Account, GuestCategory, LocalDb, Rsvp, UserRole } from "@/types/interface";

// type SeedGuest = [nom: string, telephone: string, categorie: GuestCategory, nombre: number];

// const GUESTS: SeedGuest[] = [
//   ["Kouassi", "07 08 11 20 31", "FAMILLE", 5],
//   ["Yao", "05 44 12 87 02", "FAMILLE", 3],
//   ["Koné", "01 02 33 45 18", "FAMILLE", 6],
//   ["Awa Coulibaly", "07 59 20 14 66", "AMI", 1],
//   ["Bamba", "05 06 71 90 23", "FAMILLE", 4],
//   ["Serge Kacou", "07 77 31 08 45", "COLLEGUE", 1],
//   ["N'Guessan", "01 41 52 63 74", "FAMILLE", 8],
//   ["Mariam Touré", "05 85 96 07 18", "AMI", 1],
//   ["Jean Dupont", "07 12 23 34 45", "CONNAISSANCE", 1],
//   ["Traoré", "01 56 67 78 89", "FAMILLE", 2],
//   ["Ouattara", "05 90 01 12 23", "FAMILLE", 7],
//   ["Christelle Aké", "07 34 45 56 67", "COLLEGUE", 1],
//   ["Ibrahim Sanogo", "01 78 89 90 01", "AMI", 1],
//   ["Diabaté", "05 12 34 56 78", "FAMILLE", 4],
//   ["Estelle Brou", "07 23 45 67 89", "AMI", 1],
//   ["Patrick Loukou", "01 34 56 78 90", "COLLEGUE", 1],
//   ["Koffi", "05 45 67 89 01", "FAMILLE", 5],
//   ["Fatou Diallo", "07 56 78 90 12", "CONNAISSANCE", 1],
//   ["Marc Assi", "01 67 89 01 23", "AMI", 1],
//   ["Aka", "05 78 90 12 34", "FAMILLE", 3],
//   ["Nadia Soro", "07 89 01 23 45", "COLLEGUE", 1],
//   ["Olivier Tanoh", "01 90 12 34 56", "AMI", 1],
//   ["Gnamien", "05 01 23 45 67", "FAMILLE", 6],
//   ["Rachelle Zadi", "07 13 24 35 46", "CONNAISSANCE", 1],
//   ["Yves Konan", "01 24 35 46 57", "COLLEGUE", 1],
//   ["Aïcha Cissé", "05 35 46 57 68", "AMI", 1],
//   ["Franck Ehui", "07 46 57 68 79", "COLLEGUE", 1],
//   ["Prisca Adjoua", "01 57 68 79 80", "AMI", 1],
//   ["Didier Gnahoré", "05 68 79 80 91", "CONNAISSANCE", 1],
//   ["Sandrine Ahoua", "07 79 80 91 02", "COLLEGUE", 1],
//   ["Moussa Fofana", "01 80 91 02 13", "AMI", 1],
//   ["Laure N'Dri", "05 91 02 13 24", "CONNAISSANCE", 1],
//   ["Hervé Bohoussou", "07 02 13 24 35", "COLLEGUE", 1],
//   ["Carine Yapo", "01 13 24 35 46", "AMI", 1],
//   ["Éric Méité", "05 24 35 46 57", "CONNAISSANCE", 1],
//   ["Josiane Kra", "07 35 46 57 68", "AMI", 1],
// ];

// const GUESTBOOK: [auteur: string, message: string][] = [
//   ["Tante Adjoua", "Que Dieu bénisse votre foyer et vous comble de bonheur. Nous serons là pour danser avec vous !"],
//   ["Serge K.", "Félicitations aux mariés ! Hâte de célébrer ce grand jour avec toute l'équipe."],
//   ["Mariam & Awa", "Vous formez un couple magnifique. Beaucoup d'amour, de rires et de complicité."],
// ];

// const HOUR = 3_600_000;

// export function buildSeedDb(): LocalDb {
//   const now = Date.now();
//   const guests: Rsvp[] = [];

//   GUESTS.forEach(([nom, telephone, categorie, nombrePersonnes], i) => {
//     // Inscriptions étalées sur les 12 derniers jours (dates relatives à aujourd'hui, donc
//     // toujours antérieures au mariage), de la plus ancienne à la plus récente
//     const createdAt = new Date(now - (GUESTS.length - i) * 8 * HOUR).toISOString();
//     const guest: Rsvp = {
//       id: `seed-${String(i + 1).padStart(3, "0")}`,
//       nom,
//       telephone,
//       categorie,
//       nombrePersonnes,
//       tableNumero: findTable(guests, nombrePersonnes, wedding.tableSize),
//       verificationCode: codeFromSeed(`invite-${i}`),
//       // Personne n'est encore entré : les entrées ne se valident que le jour du mariage
//       isVerified: false,
//       verifiedAt: null,
//       isRevoked: false,
//       revokedAt: null,
//       createdAt,
//       updatedAt: createdAt,
//     };
//     guests.push(guest);
//   });

//   return {
//     guests,
//     scans: [],
//     guestbook: GUESTBOOK.map(([auteur, message], i) => ({
//       id: `seed-msg-${i}`,
//       auteur,
//       message,
//       createdAt: new Date(now - (i + 1) * 26 * HOUR).toISOString(),
//     })),
//     reminders: [],
//     menu: buildDefaultMenu(),
//     accounts: buildDefaultAccounts(),
//     settings: defaultSettings,
//   };
// }

// // Comptes de démonstration (affichés sur /login). Ils disparaîtront avec le backend :
// // l'authentification se fera alors par JWT.
// export const DEMO_ACCOUNTS: { id: string; identifiant: string; password: string; name: string; role: UserRole }[] = [
//   { id: "acc-admin", identifiant: "admin", password: "mariage2026", name: "Organisateur", role: "ADMIN" },
//   { id: "acc-agent", identifiant: "agent", password: "entree2026", name: "Agent d'accueil", role: "AGENT" },
// ];

// /** Comptes de départ de la base locale ; ensuite gérés dans /admin?tab=comptes */
// export function buildDefaultAccounts(): Account[] {
//   const createdAt = new Date().toISOString();
//   return DEMO_ACCOUNTS.map((a) => ({ ...a, active: true, createdAt }));
// }
