// Types partagés : forme exacte des réponses de l'API event-backend (voir src/api).

export interface BaseResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export type GuestCategory = "FAMILLE" | "AMI" | "EGLISE" | "COLLEGUE" | "CONNAISSANCE";

export interface Rsvp {
  id: string; // UUID
  nom: string;
  telephone: string;
  categorie: GuestCategory;
  nombrePersonnes: number;
  tableNumero: number;
  verificationCode: string; // unique
  isVerified: boolean;
  verifiedAt: string | null;
  /** Invitation révoquée par l'organisateur : elle ne compte plus et sa carte est refusée */
  isRevoked: boolean;
  revokedAt: string | null;
  /** Table choisie par l'invité lui-même (sinon placement automatique) : « Réorganiser » la respecte */
  tableChoisie?: boolean;
  /** Contenu du QR Code, signé par l'API (aucune donnée personnelle) */
  qrToken?: string;
  /** Gestion seulement : jamais renvoyés par la carte publique */
  email?: string | null;
  source?: "PUBLIC" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface RsvpInput {
  nom: string;
  telephone: string;
  categorie: GuestCategory;
  nombrePersonnes: number;
  /** Table souhaitée ; absente = placement automatique */
  tableNumero?: number;
}

/** Une table proposée dans la liste déroulante du formulaire RSVP */
/** Table du plan de salle : les invitations la désignent par son numéro, l'affichage par son nom */
export interface EventTable {
  numero: number;
  /** « VIP 1 », « CAE »… modifiable dans /admin?tab=tables */
  name: string;
  /** Réservée aux parents et aux responsables de l'Église */
  isVip: boolean;
}

/** Une table proposée dans la liste déroulante du formulaire RSVP */
export interface TableOption extends EventTable {
  seats: number;
  free: number;
}

export interface CapacityStats {
  capacity: number;
  confirmed: number;
  remaining: number;
  isFull: boolean;
  /** Inscriptions fermées manuellement par l'organisateur */
  isClosed: boolean;
}

/** Photo de la médiathèque de l'événement (servie par l'API, en WebP) */
export interface EventMediaView {
  id: string;
  kind: "HERO" | "SECONDARY" | "PROGRAMME" | "GALLERY";
  url: string;
  alt: string;
  order: number;
  width: number | null;
  height: number | null;
}

/** Réglages modifiables depuis l'administration (valeurs par défaut dans config/wedding.ts) */
export interface EventSettings {
  /** Fournis par l'API (absents des valeurs de départ) */
  id?: string;
  slug?: string;
  media?: {
    hero: EventMediaView | null;
    secondary: EventMediaView | null;
    programme: EventMediaView | null;
    gallery: EventMediaView[];
  };
  capacity: number;
  tableSize: number;
  familyMax: number;
  rsvpOpen: boolean;
  guestbookOpen: boolean;
  event: EventInfo;
  menu: MenuSettings;
  home: HomeSections;
  dressCode: DressCode;
  ceremony: CeremonyPlace;
  /** Mairie (mariage civil) ; nom et adresse vides = carte non affichée */
  townHall: CeremonyPlace;
  programme: ProgrammeStep[];
  story: StoryInfo;
  /** Les invités choisissent eux-mêmes leur table dans le formulaire RSVP */
  tableChoice: boolean;
  qrCodes: QrCodeEntry[];
  /** Tables nommées (fournies par l'API) : générées selon le nombre de personnes attendues */
  tables?: EventTable[];
}

/** QR Codes de la plateforme ; `custom` = ajouté par l'organisateur (lien libre) */
export type QrKind = "rsvp" | "livre-dor" | "ma-carte" | "accueil" | "verification" | "menu" | "custom";

export interface QrCodeEntry {
  id: string;
  kind: QrKind;
  /** Titre imprimé au-dessus du QR Code */
  label: string;
  /** Consigne imprimée sous le QR Code */
  caption: string;
  /** Page du site (« /rsvp ») ou adresse complète (« https://… ») */
  target: string;
}

export type ProgrammeIcon = "rings" | "church" | "camera" | "glass" | "utensils" | "music";

/** Étape du programme de la journée, modifiable dans /admin?tab=programme */
export interface ProgrammeStep {
  id: string;
  heure: string;
  titre: string;
  description: string;
  icon: ProgrammeIcon;
  /**
   * Lieu de l'étape : un lien « Itinéraire » s'affiche sous la description. `custom` = lieu
   * saisi à la main sur l'étape (`placeName`, `placeAddress`).
   */
  place: "none" | "townHall" | "ceremony" | "reception" | "custom";
  placeName?: string;
  placeAddress?: string;
}

/** Section « Notre histoire » */
export interface StoryInfo {
  text: string;
  /** Vide = non affiché */
  groomParents: string;
  brideParents: string;
}

/**
 * Sections de la page d'accueil que l'organisateur peut masquer puis réafficher.
 * Le menu du repas a son propre interrupteur (`menu.visible`).
 */
export interface HomeSections {
  programme: boolean;
  dressCode: boolean;
  gallery: boolean;
  venue: boolean;
  guestbook: boolean;
  /** « Notre histoire », placée en fin de page */
  story: boolean;
  /** Photo de fond du programme de la journée */
  programmePhoto: ProgrammePhoto;
  /**
   * Photo envoyée par l'organisateur, utilisée si `personnalisee` : adresse de l'API en lecture ;
   * à l'enregistrement, une data URL (nouvelle photo) ou « » (photo retirée).
   */
  programmePhotoUrl: string;
}

export type ProgrammePhoto = "traditionnel" | "portrait" | "personnalisee" | "aucune";

export interface DressColor {
  name: string;
  /** Couleur au format #RRGGBB */
  hex: string;
}

export interface DressCode {
  title: string;
  description: string;
  colors: DressColor[];
  /** Recommandation complémentaire (ex. couleur à éviter) ; vide = rien d'affiché */
  note: string;
}

/**
 * Lieu de la bénédiction nuptiale (la réception est dans `EventInfo`). Son heure est celle de
 * l'étape du programme rattachée à ce lieu : une seule source, pas de risque d'incohérence.
 */
export interface CeremonyPlace {
  name: string;
  address: string;
}

export type MenuCategory = "ENTREE" | "PLAT" | "ACCOMPAGNEMENT" | "DESSERT" | "BOISSON";

export interface MenuItem {
  id: string;
  categorie: MenuCategory;
  nom: string;
  description: string;
  /** Un plat masqué reste dans la gestion mais n'apparaît plus sur l'accueil */
  visible: boolean;
}

export interface MenuSettings {
  /** Afficher la section « Menu » aux invités */
  visible: boolean;
  /** Avec service traiteur (repas servi à table) ou sans (buffet préparé par les familles) */
  catering: boolean;
  catererName: string;
}

/** Informations du mariage, modifiables tant qu'aucun invité n'est inscrit */
export interface EventInfo {
  groomName: string;
  brideName: string;
  /** ISO 8601, en UTC (heure d'Abidjan) */
  date: string;
  venueName: string;
  venueAddress: string;
}

export interface TableSummary extends EventTable {
  seats: number;
  occupied: number;
  guests: Rsvp[];
}

export type ScanResult = "VALID" | "ALREADY_USED" | "INVALID" | "REVOKED";
export type ScanSource = "QR" | "CODE" | "ADMIN";

export interface ScanLog {
  id: string;
  code: string;
  guestId: string | null;
  guestName: string | null;
  result: ScanResult;
  source: ScanSource;
  agent: string;
  createdAt: string;
}

/** Arrivées en direct (contrôle des entrées) */
export interface ScanStats {
  arrivedInvitations: number;
  arrivedPersons: number;
  totalInvitations: number;
  totalPersons: number;
}

export interface LookupResult {
  status: "FOUND" | "ALREADY_USED" | "INVALID" | "REVOKED";
  guest?: Rsvp;
}

export interface GuestbookMessage {
  id: string;
  auteur: string;
  message: string;
  createdAt: string;
}

export type ReminderChannel = "SMS" | "EMAIL";

export interface ReminderLog {
  id: string;
  canal: ReminderChannel;
  message: string;
  destinataires: number;
  createdAt: string;
}

export type UserRole = "ADMIN" | "AGENT";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  /** Événement géré dans cette session (routes /events/:eventId de l'API) */
  eventId: string;
}

/** Compte de l'espace organisateurs, tel que renvoyé par l'API (jamais de mot de passe) */
export interface AccountView {
  id: string;
  memberId: string;
  name: string;
  identifiant: string;
  role: UserRole;
  /** Propriétaire de l'événement : ne peut être ni retiré ni rétrogradé */
  isOwner: boolean;
  /** Un compte désactivé ne peut plus accéder à l'événement, sans être supprimé */
  active: boolean;
  createdAt: string;
}
