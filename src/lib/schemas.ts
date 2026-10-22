import { z } from "zod";
import { CATEGORY_VALUES } from "@/config/categories";
import { MENU_CATEGORY_VALUES } from "@/data/menu";

// Les mêmes schémas valident le formulaire (React Hook Form) et la couche API simulée,
// comme le fera le backend avec ses DTO.

export const rsvpSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(2, "Indiquez votre nom complet")
      .max(60, "60 caractères maximum")
      .regex(/^[\p{L}\p{M}' .-]+$/u, "Le nom ne doit contenir que des lettres"),
    telephone: z
      .string()
      .trim()
      .refine((v) => /^\+?[\d\s.-]+$/.test(v) && v.replace(/\D/g, "").length >= 8 && v.replace(/\D/g, "").length <= 15, "Numéro de téléphone invalide"),
    categorie: z.enum(CATEGORY_VALUES, "Choisissez une catégorie"),
    nombrePersonnes: z
      .number("Indiquez un nombre")
      .int()
      .min(1, "Minimum 1 personne")
      // Le plafond réel (réglage « maximum par famille ») est appliqué par l'API
      .max(20, "Maximum 20 personnes"),
    // Table souhaitée ; absente = placement automatique. Les places libres sont vérifiées par l'API.
    tableNumero: z.number().int().min(1).optional(),
  })
  .refine((d) => d.categorie === "FAMILLE" || d.nombrePersonnes === 1, {
    path: ["nombrePersonnes"],
    message: "Seule une famille peut venir à plusieurs",
  });

export const guestbookSchema = z.object({
  auteur: z.string().trim().min(2, "Indiquez votre nom").max(40, "40 caractères maximum"),
  message: z.string().trim().min(5, "Votre message est un peu court").max(280, "280 caractères maximum"),
});

export const loginSchema = z.object({
  identifiant: z.string().trim().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const reminderSchema = z.object({
  canal: z.enum(["SMS", "EMAIL"]),
  message: z.string().trim().min(10, "Message trop court").max(320, "320 caractères maximum"),
});

export const eventSchema = z.object({
  groomName: z.string().trim().min(2, "Prénom trop court").max(30, "30 caractères maximum"),
  brideName: z.string().trim().min(2, "Prénom trop court").max(30, "30 caractères maximum"),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Date invalide"),
  venueName: z.string().trim().min(2, "Indiquez le nom du lieu").max(80, "80 caractères maximum"),
  venueAddress: z.string().trim().min(3, "Indiquez l'adresse").max(160, "160 caractères maximum"),
});

export const menuItemSchema = z.object({
  categorie: z.enum(MENU_CATEGORY_VALUES, "Choisissez une catégorie"),
  nom: z.string().trim().min(2, "Indiquez le nom du plat").max(60, "60 caractères maximum"),
  description: z.string().trim().max(160, "160 caractères maximum"),
});

export const menuSettingsSchema = z.object({
  visible: z.boolean(),
  catering: z.boolean(),
  catererName: z.string().trim().max(60, "60 caractères maximum"),
});

export const homeSectionsSchema = z.object({
  programme: z.boolean(),
  dressCode: z.boolean(),
  gallery: z.boolean(),
  venue: z.boolean(),
  guestbook: z.boolean(),
  story: z.boolean(),
  programmePhoto: z.enum(["traditionnel", "portrait", "personnalisee", "aucune"]),
  // Image redimensionnée côté navigateur avant l'envoi : ~300 Ko pour 1920 px
  programmePhotoUrl: z.string().max(4_000_000, "Image trop lourde"),
});

export const dressCodeSchema = z.object({
  title: z.string().trim().min(2, "Indiquez un titre").max(60, "60 caractères maximum"),
  description: z.string().trim().max(280, "280 caractères maximum"),
  colors: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Nommez la couleur").max(30, "30 caractères maximum"),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
      }),
    )
    .max(8, "8 couleurs maximum"),
  note: z.string().trim().max(160, "160 caractères maximum"),
});

export const ceremonySchema = z.object({
  name: z.string().trim().min(2, "Indiquez le nom du lieu").max(80, "80 caractères maximum"),
  address: z.string().trim().min(3, "Indiquez l'adresse").max(160, "160 caractères maximum"),
});

/** Mairie : facultative (deux champs vides = retirée du site), sinon nom et adresse complets */
export const townHallSchema = z
  .object({
    name: z.string().trim().max(80, "80 caractères maximum"),
    address: z.string().trim().max(160, "160 caractères maximum"),
  })
  .superRefine((v, ctx) => {
    if (!v.name && !v.address) return;
    if (v.name.length < 2) ctx.addIssue({ code: "custom", path: ["name"], message: "Indiquez le nom de la mairie" });
    if (v.address.length < 3) ctx.addIssue({ code: "custom", path: ["address"], message: "Indiquez l'adresse de la mairie" });
  });

const programmeStepFields = z.object({
  heure: z.string().trim().min(1, "Indiquez l'heure").max(10, "10 caractères maximum"),
  titre: z.string().trim().min(2, "Indiquez un titre").max(60, "60 caractères maximum"),
  description: z.string().trim().max(200, "200 caractères maximum"),
  icon: z.enum(["rings", "church", "camera", "glass", "utensils", "music"]),
  place: z.enum(["none", "townHall", "ceremony", "reception", "custom"]),
  placeName: z.string().trim().max(80, "80 caractères maximum"),
  placeAddress: z.string().trim().max(160, "160 caractères maximum"),
});

/** Un « Autre lieu » exige son nom et son adresse (pour le lien Itinéraire) */
export const programmeStepSchema = programmeStepFields.superRefine((v, ctx) => {
  if (v.place !== "custom") return;
  if (v.placeName.length < 2) ctx.addIssue({ code: "custom", path: ["placeName"], message: "Indiquez le nom du lieu" });
  if (v.placeAddress.length < 3) ctx.addIssue({ code: "custom", path: ["placeAddress"], message: "Indiquez l'adresse du lieu" });
});

export const storySchema = z.object({
  text: z.string().trim().min(10, "Le texte est un peu court").max(600, "600 caractères maximum"),
  groomParents: z.string().trim().max(120, "120 caractères maximum"),
  brideParents: z.string().trim().max(120, "120 caractères maximum"),
});

export const qrCodeSchema = z.object({
  label: z.string().trim().min(2, "Indiquez un titre").max(40, "40 caractères maximum"),
  caption: z.string().trim().max(120, "120 caractères maximum"),
  // Une page du site (« /rsvp ») ou une adresse web complète (« https://… »)
  target: z
    .string()
    .trim()
    .refine((v) => /^\/[^\s]*$/.test(v) || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Saisissez une page du site (ex. /rsvp) ou une adresse complète (https://…)"),
});

const identifiantSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "3 caractères minimum")
  .max(30, "30 caractères maximum")
  .regex(/^[a-z0-9._-]+$/, "Lettres sans accent, chiffres, point, tiret ou souligné uniquement");

export const passwordSchema = z.object({
  password: z.string().min(8, "8 caractères minimum").max(64, "64 caractères maximum"),
});

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Indiquez un nom").max(40, "40 caractères maximum"),
  identifiant: identifiantSchema,
  role: z.enum(["ADMIN", "AGENT"]),
});

export const newAccountSchema = accountSchema.extend(passwordSchema.shape);

export const settingsSchema = z
  .object({
    event: eventSchema,
    menu: menuSettingsSchema,
    home: homeSectionsSchema,
    dressCode: dressCodeSchema,
    ceremony: ceremonySchema,
    townHall: townHallSchema,
    programme: z.array(programmeStepFields.extend({ id: z.string().min(1) })).max(15, "15 étapes maximum"),
    story: storySchema,
    tableChoice: z.boolean(),
    qrCodes: z.array(qrCodeSchema.extend({ id: z.string().min(1), kind: z.enum(["rsvp", "livre-dor", "ma-carte", "accueil", "verification", "menu", "custom"]) })).max(20),
    capacity: z.number().int().min(1, "Au moins 1 place").max(2000, "2000 places maximum"),
    tableSize: z.number().int().min(2, "Au moins 2 personnes par table").max(20, "20 personnes maximum par table"),
    familyMax: z.number().int().min(1, "Au moins 1 personne").max(20, "20 personnes maximum"),
    rsvpOpen: z.boolean(),
    guestbookOpen: z.boolean(),
  })
  // Un groupe n'est jamais séparé : une famille doit tenir à une seule table
  .refine((s) => s.familyMax <= s.tableSize, { path: ["familyMax"], message: "Une famille doit tenir à une seule table" })
  .refine((s) => s.home.programmePhoto !== "personnalisee" || s.home.programmePhotoUrl !== "", {
    path: ["home", "programmePhotoUrl"],
    message: "Envoyez d'abord une photo",
  });

export type EventInput = z.infer<typeof eventSchema>;
export type DressCodeInput = z.infer<typeof dressCodeSchema>;
export type CeremonyInput = z.infer<typeof ceremonySchema>;
export type TownHallInput = z.infer<typeof townHallSchema>;
export type ProgrammeStepInput = z.infer<typeof programmeStepSchema>;
export type StoryInput = z.infer<typeof storySchema>;
export type QrCodeInput = z.infer<typeof qrCodeSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type NewAccountInput = z.infer<typeof newAccountSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type GuestbookInput = z.infer<typeof guestbookSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
