// Types partagés. Ils reprennent le futur modèle Prisma (table RSVP) pour que le passage
// au backend NestJS ne change que la couche `src/api`.

export interface BaseResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export type GuestCategory = "FAMILLE" | "AMI" | "COLLEGUE" | "CONNAISSANCE";

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
  createdAt: string;
  updatedAt: string;
}

export interface RsvpInput {
  nom: string;
  telephone: string;
  categorie: GuestCategory;
  nombrePersonnes: number;
}

export interface CapacityStats {
  capacity: number;
  confirmed: number;
  remaining: number;
  isFull: boolean;
  /** Inscriptions fermées manuellement par l'organisateur */
  isClosed: boolean;
}

/** Réglages modifiables depuis l'administration (valeurs par défaut dans config/wedding.ts) */
export interface EventSettings {
  capacity: number;
  tableSize: number;
  familyMax: number;
  rsvpOpen: boolean;
  guestbookOpen: boolean;
  event: EventInfo;
  menu: MenuSettings;
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

export interface TableSummary {
  numero: number;
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
  name: string;
  role: UserRole;
}

export interface LocalDb {
  guests: Rsvp[];
  scans: ScanLog[];
  guestbook: GuestbookMessage[];
  reminders: ReminderLog[];
  menu: MenuItem[];
  settings: EventSettings;
}
