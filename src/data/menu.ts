// Menu de démonstration : des plats que l'on retrouve dans un mariage en Côte d'Ivoire.
// Données fictives, modifiables par l'organisateur dans /admin?tab=menu.

import type { MenuCategory, MenuItem } from "@/types/interface";

export const MENU_CATEGORIES: { value: MenuCategory; label: string; plural: string }[] = [
  { value: "ENTREE", label: "Entrée", plural: "Entrées" },
  { value: "PLAT", label: "Plat", plural: "Plats" },
  { value: "ACCOMPAGNEMENT", label: "Accompagnement", plural: "Accompagnements" },
  { value: "DESSERT", label: "Dessert", plural: "Desserts" },
  { value: "BOISSON", label: "Boisson", plural: "Boissons" },
];

export const MENU_CATEGORY_VALUES = MENU_CATEGORIES.map((c) => c.value) as [MenuCategory, ...MenuCategory[]];

type SeedDish = [categorie: MenuCategory, nom: string, description: string];

const DISHES: SeedDish[] = [
  ["ENTREE", "Salade d'avocat aux crevettes", "Avocat, crevettes, tomates et vinaigrette au citron vert."],
  ["ENTREE", "Pastels de poisson", "Petits chaussons croustillants farcis au thon, servis avec une sauce tomate pimentée."],
  ["ENTREE", "Brochettes de bœuf", "Brochettes marinées aux épices, grillées au feu de bois."],

  ["PLAT", "Poulet braisé", "Poulet mariné à l'ail et au gingembre, braisé au charbon, oignons et tomates fraîches."],
  ["PLAT", "Poisson braisé", "Carpe entière braisée, servie avec sa sauce aux oignons et au piment."],
  ["PLAT", "Kedjenou de poulet", "Poulet mijoté à l'étouffée avec tomates, aubergines et piment."],
  ["PLAT", "Riz gras à la viande", "Riz cuit dans une sauce tomate parfumée, viande de bœuf et légumes."],
  ["PLAT", "Sauce graine", "Sauce onctueuse aux noix de palme, viande et poisson fumé."],

  ["ACCOMPAGNEMENT", "Attiéké", "Semoule de manioc, l'incontournable de la table ivoirienne."],
  ["ACCOMPAGNEMENT", "Alloco", "Bananes plantains mûres, frites et dorées."],
  ["ACCOMPAGNEMENT", "Foutou banane", "Pâte de banane plantain et de manioc, à déguster avec la sauce graine."],
  ["ACCOMPAGNEMENT", "Riz blanc parfumé", "Pour accompagner les sauces et les grillades."],

  ["DESSERT", "Gâteau de mariage", "La pièce montée des mariés, coupée en fin de dîner."],
  ["DESSERT", "Salade de fruits frais", "Ananas, mangue, papaye et fruit de la passion."],
  ["DESSERT", "Dêguê", "Yaourt onctueux aux grains de mil, servi bien frais."],

  ["BOISSON", "Bissap", "Jus de fleurs d'hibiscus à la menthe."],
  ["BOISSON", "Gnamakoudji", "Jus de gingembre frais, légèrement piquant."],
  ["BOISSON", "Jus de passion", "Fruit de la passion pressé, servi glacé."],
  ["BOISSON", "Vins, champagne et sucreries", "Sélection de vins, champagne pour le toast, sodas et eau minérale."],
];

export function buildDefaultMenu(): MenuItem[] {
  return DISHES.map(([categorie, nom, description], i) => ({
    id: `seed-menu-${String(i + 1).padStart(2, "0")}`,
    categorie,
    nom,
    description,
    visible: true,
  }));
}
