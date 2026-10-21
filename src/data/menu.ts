// Catégories du menu du repas. Les plats eux-mêmes viennent de l'API (gérés dans
// /admin?tab=menu) : aucun plat n'est codé en dur dans le site.

import type { MenuCategory } from "@/types/interface";

export const MENU_CATEGORIES: { value: MenuCategory; label: string; plural: string }[] = [
  { value: "ENTREE", label: "Entrée", plural: "Entrées" },
  { value: "PLAT", label: "Plat", plural: "Plats" },
  { value: "ACCOMPAGNEMENT", label: "Accompagnement", plural: "Accompagnements" },
  { value: "DESSERT", label: "Dessert", plural: "Desserts" },
  { value: "BOISSON", label: "Boisson", plural: "Boissons" },
];

export const MENU_CATEGORY_VALUES = MENU_CATEGORIES.map((c) => c.value) as [MenuCategory, ...MenuCategory[]];
