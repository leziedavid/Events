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

export const settingsSchema = z
  .object({
    event: eventSchema,
    menu: menuSettingsSchema,
    capacity: z.number().int().min(1, "Au moins 1 place").max(2000, "2000 places maximum"),
    tableSize: z.number().int().min(2, "Au moins 2 personnes par table").max(20, "20 personnes maximum par table"),
    familyMax: z.number().int().min(1, "Au moins 1 personne").max(20, "20 personnes maximum"),
    rsvpOpen: z.boolean(),
    guestbookOpen: z.boolean(),
  })
  // Un groupe n'est jamais séparé : une famille doit tenir à une seule table
  .refine((s) => s.familyMax <= s.tableSize, { path: ["familyMax"], message: "Une famille doit tenir à une seule table" });

export type EventInput = z.infer<typeof eventSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type GuestbookInput = z.infer<typeof guestbookSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
