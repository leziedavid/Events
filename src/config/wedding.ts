// Source unique des informations du mariage : tout ce qui est propre aux mariés
// (noms, date, lieu, programme, photos) se modifie ici, sans toucher aux composants.

import type { CeremonyPlace, DressCode, EventInfo, EventSettings, HomeSections, ProgrammeStep, QrCodeEntry, QrKind, StoryInfo } from "@/types/interface";

export interface GalleryItem {
  src: string;
  alt: string;
  /** Classe Tailwind de ratio : varie les hauteurs pour l'effet Masonry */
  ratio: string;
  /** Cadrage de la photo dans sa vignette */
  position?: string;
}

const portrait = "/images/couple-portrait.jpg";
const traditionnel = "/images/couple-traditionnel.jpg";

export const wedding = {
  groom: { prenom: "Emmanuel", parents: "" },
  bride: { prenom: "Grâce", parents: "" },
  hashtag: "#EmmanuelEtGrace2026",

  // Abidjan est en UTC+0 toute l'année
  date: "2026-11-26T15:00:00+00:00",

  venue: {
    name: "Salle de réception",
    address: "Cocody, Abidjan, Côte d'Ivoire",
  },

  capacity: 150,
  tableSize: 8,
  familyMax: 8,

  images: { portrait, traditionnel },

  // Laisser vide pour la mélodie générée dans le navigateur ; sinon déposer un fichier
  // dans public/audio et indiquer son chemin (ex. "/audio/musique.mp3").
  music: { src: "" },

  story:
    "Deux chemins qui se croisent, deux familles qui s'unissent. C'est avec une immense joie que nous vous convions à célébrer notre union et à partager avec nous ce jour béni.",

  // Valeurs de départ ; l'organisateur les modifie dans /admin?tab=programme
  programme: [
    { id: "p1", heure: "09h00", titre: "Mariage civil", description: "Échange des consentements à la mairie, entourés de nos familles.", icon: "rings", place: "none" },
    { id: "p2", heure: "11h00", titre: "Bénédiction nuptiale", description: "Cérémonie religieuse et bénédiction des mariés.", icon: "church", place: "ceremony" },
    { id: "p3", heure: "13h00", titre: "Séance photo", description: "Photos avec les familles et les invités dans les jardins.", icon: "camera", place: "none" },
    { id: "p4", heure: "15h00", titre: "Cocktail de bienvenue", description: "Accueil des invités, contrôle des invitations et rafraîchissements.", icon: "glass", place: "reception" },
    { id: "p5", heure: "17h00", titre: "Dîner de réception", description: "Entrée des mariés, discours et repas.", icon: "utensils", place: "none" },
    { id: "p6", heure: "20h00", titre: "Soirée dansante", description: "Ouverture du bal, gâteau et piste de danse jusqu'au bout de la nuit.", icon: "music", place: "none" },
  ] as ProgrammeStep[],

  // Deux photos pour l'instant : elles sont recadrées différemment en attendant le reste.
  gallery: [
    { src: traditionnel, alt: "Les mariés en tenue traditionnelle", ratio: "aspect-[3/4]", position: "object-top" },
    { src: portrait, alt: "Portrait des mariés", ratio: "aspect-square" },
    { src: traditionnel, alt: "Parures et pagne kita", ratio: "aspect-[4/3]", position: "object-bottom" },
    { src: portrait, alt: "Complicité", ratio: "aspect-[3/4]", position: "object-top" },
    { src: traditionnel, alt: "Tradition", ratio: "aspect-square", position: "object-right" },
    { src: portrait, alt: "Sourires", ratio: "aspect-[4/5]", position: "object-center" },
  ] as GalleryItem[],
};

/**
 * Informations du mariage au départ. L'organisateur peut les modifier dans
 * /admin?tab=evenement tant qu'aucun invité n'est inscrit : côté client, lire ces valeurs avec
 * le hook `useEventInfo()`, pas directement ici.
 */
export const defaultEvent: EventInfo = {
  groomName: wedding.groom.prenom,
  brideName: wedding.bride.prenom,
  date: wedding.date,
  venueName: wedding.venue.name,
  venueAddress: wedding.venue.address,
};

/** Sections affichées au départ : menu, galerie et « Notre histoire » masqués (réactivables) */
export const defaultHome: HomeSections = {
  programme: true,
  dressCode: true,
  gallery: false,
  venue: true,
  guestbook: true,
  story: false,
  programmePhoto: "traditionnel",
  programmePhotoUrl: "",
};

// Valeurs de démonstration, inspirées des tenues des photos (pagne kita orange, or, blanc)
export const defaultDressCode: DressCode = {
  title: "Élégance et couleurs du kita",
  description:
    "Tenue de soirée chic. Pagnes, kita et tenues traditionnelles sont les bienvenus : venez sublimés dans les couleurs du mariage.",
  colors: [
    { name: "Or", hex: "#C59D5F" },
    { name: "Orange kita", hex: "#D9822B" },
    { name: "Ivoire", hex: "#F5EFE3" },
    { name: "Bleu nuit", hex: "#14274A" },
  ],
  note: "Merci d'éviter le blanc intégral, réservé à la mariée.",
};

// Lieu fictif, à remplacer par l'église ou la paroisse réelle
export const defaultCeremony: CeremonyPlace = {
  name: "Paroisse de la bénédiction",
  address: "Riviera Golf, Cocody, Abidjan, Côte d'Ivoire",
};

export const defaultStory: StoryInfo = {
  text: wedding.story,
  groomParents: wedding.groom.parents,
  brideParents: wedding.bride.parents,
};

/** Page visée par défaut par chaque QR Code de la plateforme (rétablie par « Lien par défaut ») */
export const QR_DEFAULT_TARGETS: Record<Exclude<QrKind, "custom">, string> = {
  rsvp: "/rsvp",
  "livre-dor": "/livre-dor",
  "ma-carte": "/ma-carte",
  accueil: "/",
  verification: "/verification",
};

export const defaultQrCodes: QrCodeEntry[] = [
  { id: "qr-rsvp", kind: "rsvp", label: "Confirmer ma présence", caption: "Scannez pour confirmer votre présence et recevoir votre carte d'invitation.", target: QR_DEFAULT_TARGETS.rsvp },
  { id: "qr-livre-dor", kind: "livre-dor", label: "Livre d'or", caption: "Scannez pour laisser un mot aux mariés.", target: QR_DEFAULT_TARGETS["livre-dor"] },
  { id: "qr-ma-carte", kind: "ma-carte", label: "Retrouver ma carte", caption: "Carte égarée ? Scannez et saisissez votre numéro de téléphone.", target: QR_DEFAULT_TARGETS["ma-carte"] },
  { id: "qr-accueil", kind: "accueil", label: "Notre mariage", caption: "Programme, lieux et dress code : tout est sur notre site.", target: QR_DEFAULT_TARGETS.accueil },
  { id: "qr-verification", kind: "verification", label: "Contrôle des entrées", caption: "Réservé aux agents d'accueil.", target: QR_DEFAULT_TARGETS.verification },
];

/** Adresse complète encodée dans un QR Code : une page du site est rattachée au domaine courant */
export function resolveQrTarget(target: string, origin: string): string {
  return /^https?:\/\//i.test(target) ? target : `${origin}${target.startsWith("/") ? "" : "/"}${target}`;
}

/** Réglages de départ ; l'organisateur peut ensuite les changer dans /admin?tab=evenement */
export const defaultSettings: EventSettings = {
  capacity: wedding.capacity,
  tableSize: wedding.tableSize,
  familyMax: wedding.familyMax,
  rsvpOpen: true,
  guestbookOpen: true,
  event: defaultEvent,
  // Traiteur fictif, pour la démonstration
  // Menu masqué sur l'accueil au départ : il reste géré dans /admin?tab=menu
  menu: { visible: false, catering: true, catererName: "Saveurs d'Akwaba" },
  home: defaultHome,
  dressCode: defaultDressCode,
  ceremony: defaultCeremony,
  programme: wedding.programme,
  story: defaultStory,
  tableChoice: true,
  qrCodes: defaultQrCodes,
};

export const coupleNamesOf = (event: EventInfo) => `${event.groomName} & ${event.brideName}`;

/** « de » ou « d' » selon l'initiale du prénom : « de David », mais « d'Emmanuel » */
export const deOrD = (name: string) => (/^[aeiouyhàâäéèêëîïôöùûü]/i.test(name.trim()) ? "d'" : "de ");

/** « Mariage d'Emmanuel & Grâce » */
export const weddingTitle = (event: EventInfo = defaultEvent) => `Mariage ${deOrD(event.groomName)}${coupleNamesOf(event)}`;

/** Valeur de départ, pour ce qui est rendu côté serveur (métadonnées de la page) */
export const coupleNames = coupleNamesOf(defaultEvent);

// Les dates sont stockées et affichées en UTC : c'est l'heure d'Abidjan toute l'année.
export function weddingDateLabel(date: string = wedding.date): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
  // « Samedi 19 décembre 2026 » : seule l'initiale prend la majuscule
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function weddingTimeLabel(date: string = wedding.date): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    .format(new Date(date))
    .replace(":", "h");
}

const RECEPTION_HOURS = 8;

/** Lien « Ajouter à Google Agenda » (aucune API : simple modèle d'URL) */
export function googleCalendarUrl(event: EventInfo = defaultEvent): string {
  const fmt = (time: number) => new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const start = new Date(event.date).getTime();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: weddingTitle(event),
    dates: `${fmt(start)}/${fmt(start + RECEPTION_HOURS * 3_600_000)}`,
    details: "Votre présence nous honorera. Pensez à présenter votre carte d'invitation à l'entrée.",
    location: `${event.venueName}, ${event.venueAddress}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export const mapsEmbedUrl = (address: string) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
export const mapsDirectionsUrl = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;