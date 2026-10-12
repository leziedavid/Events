# AGENTS.md — Invitation numérique de mariage (mariage-invitation)

Guide de démarrage rapide pour les assistants IA et les développeurs. Architecture calquée sur
`../in-seach` (Djamko).

**État : démonstration pour les mariés.** Aucun backend : les données sont fictives et persistées
dans le `localStorage` du navigateur. Une fois la maquette validée, un backend NestJS + Prisma +
PostgreSQL prendra le relais (voir « Passage au backend »).

## Produit

Faire-part numérique : page d'accueil immersive, confirmation de présence (RSVP) avec quota de
150 places, répartition automatique par tables de 8, carte d'invitation avec QR Code, contrôle
des entrées par scan, tableau de bord d'administration. Interface et commentaires en **français**.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS v4
- Composants maison de style shadcn (`src/components/ui`), icônes `lucide-react`, animations
  framer-motion, toasts `sonner`, thème clair / nuit `next-themes`
- Données : React Query au-dessus de `src/api/*` (API simulée), Zustand pour la session
- Formulaires : React Hook Form + Zod (`src/lib/schemas.ts`)
- QR : `qrcode.react` (génération), `BarcodeDetector` ou `jsqr` (lecture) ; carte exportée avec
  `html-to-image` ; exports `xlsx` et `jspdf` ; graphiques `recharts`

## Commandes

```bash
npm run dev      # http://localhost:3000 (port par défaut de Next ; autre port : npm run dev -- -p 3400)
npm run build    # build de production (inclut le contrôle TypeScript)
npm run lint
npx tsc --noEmit -p .
```

## Architecture

- `src/config/wedding.ts` : **source unique** des informations du mariage (prénoms, date, lieu,
  capacité, taille des tables, programme, galerie, musique). `src/config/categories.ts` : les
  quatre catégories d'invités.
- `src/app/` : `/` (accueil), `/rsvp`, `/invitation/[code]` (carte), `/livre-dor` (formulaire du livre d'or), `/ma-carte` (retrouver sa carte), `/login`, `/verification`
  (agents d'accueil), `/admin?tab=dashboard|invites|tables|scans|menu|rappels|livre-dor|evenement|donnees`.
- `src/proxy.ts` (middleware Next 16) : `/admin` et `/verification` exigent le cookie `token` ;
  `/admin` exige en plus `role=ADMIN`.
- `src/api/*.ts` : API simulée. Chaque fonction a la signature du futur appel HTTP et renvoie un
  `BaseResponse<T>` (`src/types/interface.ts`). **Toutes les règles métier y sont** : quota,
  doublon de téléphone, attribution des tables, validation unique d'une entrée.
- `src/lib/storage.ts` : la « base » (`localStorage`, clé `mariage-db-v3` — incrémenter le suffixe quand les valeurs de départ changent), initialisée par
  `src/data/seed.ts`. Chaque écriture émet `DB_EVENT` ; `QueryProvider` invalide alors toutes les
  requêtes (et écoute `storage` pour les autres onglets) : c'est le « temps réel » de la démo.
- `src/api/settings-api.ts` : réglages modifiables par l'organisateur (`EventSettings` : capacité,
  taille des tables, maximum par famille, inscriptions et livre d'or ouverts ou fermés). Les
  valeurs de `wedding.ts` ne sont que les valeurs de départ (`defaultSettings`) : **lire la
  capacité et la taille des tables depuis les réglages, jamais depuis `wedding`**.
- Informations du mariage (prénoms, date, lieu) : `EventSettings.event`, initialisé par
  `defaultEvent`. **Côté client, toujours les lire avec `useEventInfo()`**, jamais dans `wedding`
  (qui ne garde que les valeurs de départ, les photos, le programme, la galerie). Les libellés
  prennent la date en paramètre : `weddingDateLabel(event.date)`, `googleCalendarUrl(event)`,
  `mapsEmbedUrl(event.venueAddress)`. Seules les métadonnées serveur (`layout.tsx` : titre de
  l'onglet, aperçu de partage) restent sur les valeurs de départ.
- `src/api/menu-api.ts` + `src/data/menu.ts` : menu du repas (plats par catégorie, visibles ou
  masqués) ; `EventSettings.menu` : section affichée ou non, avec ou sans traiteur, nom du traiteur.
- `src/hooks/useWedding.ts` : tous les hooks React Query (lecture et mutations).
- `src/lib/security.ts` : code d'invitation, signature du QR Code, normalisation des téléphones,
  limite de débit. `src/lib/tables.ts` : placement. `src/lib/badge.ts` / `export.ts` : exports.
- `src/components/` : `home/` (sections de l'accueil), `rsvp/`, `invitation/`, `verification/`,
  `admin/` (un fichier par onglet), `shared/` (`Reveal`, ornements, `CapacityMeter`), `layout/`.

## Règles métier

- Capacité 150 personnes : `places restantes = 150 − somme des personnes confirmées`. À 0, le
  formulaire est remplacé par « Les réservations sont désormais clôturées. »
- Famille : 1 à 8 personnes. Ami, collègue, connaissance : toujours 1.
- Tables de 8 : un groupe n'est jamais séparé ; il va à la première table où il tient
  (`findTable`). Une place libérée par une suppression est réutilisée en priorité.
- Un numéro de téléphone = une seule invitation (comparaison sur le numéro normalisé).
- Révocation (`isRevoked`) : l'invitation reste dans la liste mais ne compte plus (quota, tables,
  rappels) et sa carte est refusée à l'entrée ; restaurable s'il reste de la place. Impossible
  une fois l'invité entré. « Supprimer » efface définitivement.
- La capacité ne peut pas descendre sous le nombre de personnes confirmées ; changer la taille
  des tables replace tous les invités (`reassignAll`).
- Prénoms, date et lieu ne sont modifiables que **tant qu'aucune invitation n'existe** (même
  révoquée) : ils figurent sur les cartes. Le verrou est dans `updateSettings` ; « Tout effacer »
  (onglet Données, `clearAllData`) vide les invitations en gardant réglages et menu, ce qui le lève.
- Inscriptions fermées (`rsvpOpen = false`) : le formulaire public est clôturé, l'organisateur
  peut toujours ajouter des invités (`createRsvp(..., { asAdmin: true })`).
- Le QR Code ne contient que `CODE.SIGNATURE`, aucune donnée personnelle. Une invitation ne se
  valide qu'une fois ; un second passage affiche l'heure de la première entrée.

## Conventions

- Couleurs via les tokens du thème (`primary`/`gold`, `navy`, `muted`, `success`, `warning`…),
  définis pour le clair et le nuit dans `globals.css`. Compatibilité `dark:` obligatoire.
- Exception : `InvitationBadge` a ses couleurs en dur et ses tailles en `cqw`, pour être identique
  à l'écran, en modale et dans l'image exportée.
- **Espace de gestion (`/admin`)** : interface façon panneau de réglages — barre latérale groupée
  avec recherche (tiroir ouvert par ☰ sous `lg`), contenu en sections faites de lignes « titre +
  description à gauche, contrôle à droite ». Utiliser les briques de `components/admin/ui.tsx`
  (`Section`, `SettingRow`, `Switch`, `Segmented`, `NumberField`, `Pill`, `IconButton`, `Box`) ;
  palette neutre et plate via la classe `.admin-ui` de `globals.css` (pas de `glass`, pas de
  `rounded-3xl`, pas de police d'apparat). Nouvel onglet : l'ajouter à `GROUPS` dans
  `app/admin/page.tsx`.
- Apparitions au défilement : `Reveal`. Respecter `useReducedMotion`. Pas d'`AnimatePresence
  mode="wait"` sur un contenu fonctionnel (résultat de scan, onglets) : l'affichage ne doit jamais
  attendre la fin d'une animation de sortie.
- Fond semi-transparent : toujours un `background-color` opaque dessous (voir `.ambient-bg`).
- `Modal` est en z-1000 / 1001 : tout ce qui s'ouvre depuis une modale doit être ≥ 1100.
- **CSP** : tout nouveau domaine externe (images, carte, API) s'ajoute dans `next.config.js`.
- Titres en `font-display` (Cormorant), prénoms en `font-script` (Great Vibes), texte en Jost.
- Commentaires en français, expliquant le **pourquoi**.

## Passage au backend (NestJS)

1. Remplacer le corps des fonctions de `src/api/*.ts` par des `fetch` ; signatures, hooks et
   composants ne changent pas. Supprimer `src/lib/storage.ts` et `src/data/seed.ts`.
2. Modèle Prisma `Rsvp` = interface `Rsvp` (`verificationCode` unique, `isVerified`, `verifiedAt`).
   Créer aussi `ScanLog`, `GuestbookMessage`, `ReminderLog`.
3. Ce qui n'est que simulé et doit devenir réel côté serveur :
   - signature du QR Code → HMAC-SHA256 avec un secret serveur (`signCode`) ;
   - connexion → JWT (comptes en clair dans `DEMO_ACCOUNTS`, affichés sur `/login`, à supprimer) ;
   - limite de débit → `ThrottlerGuard` ; protection CSRF ; validation par DTO ;
   - quota et tables → dans une transaction (deux confirmations simultanées ne doivent pas
     dépasser 150) ;
   - SMS, e-mail avec la carte en pièce jointe, rappels → fournisseurs réels (aujourd'hui un
     simple toast et une ligne d'historique) ;
   - temps réel → socket.io à la place de l'événement `storage`.

## À fournir par les mariés

Date, heure et lieu exacts, noms des parents, programme, photos de la galerie (deux photos
recadrées pour l'instant) et éventuellement un fichier audio (`public/audio`, puis `music.src`
dans `wedding.ts` ; à défaut une mélodie est générée par Web Audio).

## Dernières modifications (du plus récent au plus ancien)

Tenir cette liste à jour à chaque fonctionnalité livrée (date, résumé, fichiers principaux).

- **2026-10-12** — **Retrouver ma carte.** Page `/ma-carte` (`app/ma-carte/page.tsx`) : l'invité
  saisit le téléphone de son inscription ou le code de sa carte (`findRsvp`, limité en débit) et
  est conduit à `/invitation/[code]`, où il peut la présenter ou la télécharger. Liens : en-tête
  (« Ma carte »), menu ☰, bloc RSVP de l'accueil, page `/rsvp`, carte introuvable. La barre de
  navigation complète ne s'affiche plus qu'à partir de `xl` (sept liens), le menu ☰ en dessous.

- **2026-10-12** — **Menu du repas.** Section « Le menu » sur l'accueil
  (`components/home/MenuSection.tsx`, lien dans l'en-tête) et onglet de gestion
  `/admin?tab=menu` (`components/admin/MenuTab.tsx`) : afficher ou masquer la section, service
  avec ou sans traiteur, nom du traiteur, ajout / modification / suppression / masquage des
  plats. 19 plats ivoiriens fictifs dans `data/menu.ts`.

- **2026-10-12** — **Informations du mariage modifiables.** Onglet Événement : prénoms, date,
  lieu éditables tant qu'aucun invité n'est inscrit, verrouillés ensuite. Tout le site les lit
  via `useEventInfo()`. Onglet Données : « Tout effacer » (repartir de zéro).

- **2026-10-12** — **Gestion refondue + menu mobile.** `/admin` adopte l'interface « panneau de
  réglages » (`app/admin/page.tsx`, `components/admin/ui.tsx`, `.admin-ui`) avec tiroir de menu
  sur mobile. Nouveaux onglets Événement et Données (`SettingsTab.tsx`), Rappels et Livre d'or
  séparés (`CommunicationTab.tsx`). Nouvelles fonctions : réglages modifiables
  (`api/settings-api.ts` : nombre de places, personnes par table, maximum par famille, ouverture
  des inscriptions et du livre d'or), révocation / restauration d'une invitation
  (`revokeRsvp`, `restoreRsvp`), nombre de places d'une famille modifiable depuis la liste,
  « Réorganiser les tables ». Accueil : menu ☰ sous `lg` (`SiteHeader.tsx`).

- **2026-10-12** — **QR Code du livre d'or** : la section « Livre d'or » de l'accueil
  (`components/home/Guestbook.tsx`) affiche un QR Code qui ouvre la nouvelle page **/livre-dor**
  (`app/livre-dor/page.tsx` : formulaire en premier, pensé pour le téléphone, puis les messages).
  Formulaire extrait dans `components/guestbook/GuestbookForm.tsx`, partagé par les deux.

- **2026-10-12** — Création du projet : accueil (bannière, compte à rebours, mariés, programme,
  galerie Masonry, carte, QR Code principal, livre d'or, musique), RSVP, carte d'invitation,
  contrôle des entrées, administration (tableau de bord, invités, tables, scans, rappels),
  thème clair / nuit, données de démonstration en `localStorage`.
