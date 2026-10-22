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
  (agents d'accueil), `/admin?tab=dashboard|invites|tables|scans|menu|rappels|livre-dor|qr-codes|accueil|programme|evenement|comptes|donnees`.
- `src/proxy.ts` (middleware Next 16) : `/admin` et `/verification` exigent le cookie `token` ;
  `/admin` exige en plus `role=ADMIN`.
- `src/api/*.ts` : API simulée. Chaque fonction a la signature du futur appel HTTP et renvoie un
  `BaseResponse<T>` (`src/types/interface.ts`). **Toutes les règles métier y sont** : quota,
  doublon de téléphone, attribution des tables, validation unique d'une entrée.
- `src/lib/storage.ts` : la « base » (`localStorage`, clé `mariage-db-v5` — incrémenter le suffixe quand les valeurs de départ changent), initialisée par
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

- Accueil (`components/home/HomeContent.tsx`) : Bannière, Programme (photo de fond), Dress code,
  Menu, Galerie, Lieux (bénédiction + réception), bloc RSVP, Livre d'or, Notre histoire (en fin
  de page). Chaque section sauf la bannière et le bloc RSVP s'affiche ou se masque dans
  `/admin?tab=accueil` (`settings.home`, `settings.menu.visible`) ; l'en-tête ne montre que les
  liens des sections visibles. Au départ, Menu, Galerie et Notre histoire sont masqués.
- **Tout contenu ajouté à l'accueil doit être réglable dans la gestion** (demande des mariés) :
  dress code, lieu de la bénédiction, texte et parents de « Notre histoire » (onglet Page
  d'accueil), étapes du programme (onglet Programme), choix de table (onglet Événement), liens
  des QR Codes (onglet QR Codes). Valeurs de départ dans `config/wedding.ts` (`default*`), lues
  côté client via `useSettings()` ; jamais `wedding.*` directement dans un composant.
- L'heure de la bénédiction est celle de l'étape du programme rattachée au lieu « bénédiction »
  (une seule source).
- Photo du programme : les photos fournies (590 px) s'affichent **à leur taille réelle**, fixes au
  centre de l'écran, dans une section passée en palette nuit (classe `dark` sur la section) ; les
  étirer en plein écran les rend floues. Une photo envoyée (`lib/image.ts`, réduite à 1920 px,
  stockée en data URL) couvre toute la section. `writeDb` renvoie `false` si le navigateur refuse
  l'écriture (quota) : `updateSettings` le signale au lieu d'échouer en silence.
- Comptes (`api/accounts-api.ts`, onglet Comptes) : rôles ADMIN (toute la gestion) et AGENT
  (contrôle des entrées seul, via `proxy.ts`). Identifiant en minuscules et unique, mot de passe
  8 caractères minimum, compte désactivable. Il reste toujours un administrateur actif, et on ne
  peut ni supprimer ni désactiver son propre compte. La page de connexion ne propose que les
  comptes de démonstration encore intacts (`getDemoLogins`). DÉMO : mots de passe en clair dans
  le navigateur — à hacher côté serveur.
- Gestion des invités : la table choisie par l'invité est signalée (« choisie ») dans Invités,
  Tables et l'export (colonne « Table choisie ») ; l'ajout et la modification proposent la même
  liste de tables que le formulaire public.
- QR Codes de la plateforme (`settings.qrCodes`) : lien = page du site (« /rsvp ») ou adresse
  complète ; `resolveQrTarget` y ajoute le domaine courant, `useQrUrl(kind)` le fournit aux
  composants de l'accueil. Les affiches (`QrTab.tsx`) s'exportent avec `downloadBadge` /
  `printBadge`. Imprimés depuis localhost, ils pointent vers l'ordinateur : l'onglet le signale.
- Choix de table : le formulaire RSVP propose une liste déroulante des tables (`tableOptions`) ;
  seules celles qui peuvent accueillir **tout** le groupe apparaissent, une table pleine disparaît.
  Sans choix, placement automatique. Une table choisie (`tableChoisie`) est vérifiée par l'API et
  conservée par « Réorganiser les tables » tant que le groupe y tient.

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
- Prénoms, date et lieu restent **toujours modifiables** (onglet Événement), même avec des
  inscrits : les cartes en ligne lisent `useEventInfo()` et se mettent à jour ; celles déjà
  téléchargées en image gardent les anciennes valeurs (l'onglet le signale).
- **RSVP réels en production depuis le 21/10/2026** : aucune donnée fictive dans le site (plus de
  `data/seed.ts` ni `lib/storage.ts`, plus de plats codés en dur) ; tout vient de l'API.
- Inscriptions fermées (`rsvpOpen = false`) : le formulaire public est clôturé, l'organisateur
  peut toujours ajouter des invités (`createRsvp(..., { asAdmin: true })`).
- Le QR Code contient le jeton signé par l'API (`qrToken`, `INV1…`), aucune donnée personnelle ;
  les cartes de la première version (`CODE.SIGNATURE`) restent acceptées à l'entrée. Une invitation ne se
  valide qu'une fois ; un second passage affiche l'heure de la première entrée.

## Conventions

- Couleurs via les tokens du thème (`primary`/`gold`, `navy`, `muted`, `success`, `warning`…),
  définis pour le clair et le nuit dans `globals.css`. Compatibilité `dark:` obligatoire.
  **Palette du mariage : terracotta et beige** (comme le dress code) sur les pages publiques ;
  les jetons gardent leurs noms (`gold` = terracotta, `navy` = brun terracotta profond). La
  gestion garde sa palette or / bleu nuit, figée dans `.admin-ui` : ne pas l'oublier en
  changeant les couleurs du site.
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

- **2026-10-22** — **Couleurs terracotta et beige.** Pages publiques passées en terracotta et
  beige (jetons de `globals.css`, clair et nuit ; carte d'invitation, QR Codes, bloc RSVP,
  couleur de la barre du navigateur) ; `/admin` inchangé (palette figée dans `.admin-ui`). Dress
  code : deux couleurs nuancées (Terracotta `#C4673F`, Beige `#D9C2A3`), pastilles en dégradé de
  leurs nuances (`DressCodeSection.tsx`). Côté API, le correctif unique
  `2026-10-22-dress-code-terracotta-beige` (`prisma/seed-patches.ts`) met à jour l'événement.

- **2026-10-22** — **Mairie (mariage civil).** « Nous rejoindre » (`components/home/Venue.tsx`)
  affiche la mairie en premier (mairie → bénédiction → réception), seulement si son nom et son
  adresse sont renseignés (`hasPlace`). Gestion dans /admin?tab=accueil, section « Mairie
  (mariage civil) » juste après le lieu de la bénédiction (`PlaceForm` partagé, `townHallSchema` :
  deux champs vides = retirée). Lieu « Mairie » pour les étapes du programme (heure et lien
  Itinéraire). `EventSettings.townHall`.

- **2026-10-21** — **Menu par QR Code, cartes signées par l'API, informations modifiables.**
  Page **/menu** (`app/menu/page.tsx`, chargement / erreur / menu vide, pensée mobile) ouverte par
  le nouveau QR Code « Le menu » de /admin?tab=qr-codes ; rendu partagé avec l'accueil
  (`MenuBoard` dans `components/home/MenuSection.tsx`). La carte encode `qrToken` (jeton signé de
  l'API). Suppression des données de démonstration (`data/seed.ts`, `lib/storage.ts`, menu
  fictif de `data/menu.ts`, signature de démo de `lib/security.ts`). Onglet Événement : prénoms,
  date et lieu toujours modifiables.

- **2026-10-21** — **Photo du programme nette, comptes, suivi des tables choisies.** Fond du
  programme refait (`Programme.tsx`) + envoi d'une photo personnelle (Page d'accueil,
  `lib/image.ts`). Onglet **/admin?tab=comptes** (`AccountsTab.tsx`, `api/accounts-api.ts`) :
  création, modification, mot de passe, activation, suppression des comptes admin et agent ; la
  connexion lit ces comptes. Tables choisies visibles dans Invités, Tables et l'export.

- **2026-10-21** — **QR Codes, programme et histoire réglables.** Onglet **/admin?tab=qr-codes**
  (`components/admin/QrTab.tsx`) : les 5 QR Codes de la plateforme (RSVP, livre d'or, retrouver
  ma carte, site, contrôle des entrées) + QR personnalisés ; lien, titre et consigne modifiables,
  affiche imprimable téléchargeable en PNG ou imprimée. Onglet **/admin?tab=programme**
  (`ProgrammeTab.tsx`) : étapes ajoutables, modifiables, réordonnables. « Notre histoire »
  masquée par défaut, son texte et les parents se règlent dans Page d'accueil. Interrupteur
  « Choix de la table par les invités » (Événement). Base locale `mariage-db-v5`.

- **2026-10-21** — **Accueil réorganisé + choix de table.** Ordre et visibilité des sections dans
  `components/home/HomeContent.tsx` ; « Notre histoire » passe en fin de page, Menu et Galerie
  masqués par défaut. Nouvel onglet **/admin?tab=accueil** (`components/admin/HomeTab.tsx`) :
  sections affichées, photo de fond du programme, dress code (couleurs, consigne), lieu de la
  bénédiction nuptiale. Nouvelle rubrique `DressCodeSection.tsx`, photo de fond et liens
  « Itinéraire » dans `Programme.tsx`, `Venue.tsx` devient « Les lieux » (bénédiction et
  réception, carte commutable). RSVP : liste déroulante des tables (`RsvpForm.tsx`,
  `getTableOptions`, `checkChosenTable`, `lib/tables.ts`). Base locale passée en `mariage-db-v4`.

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
