import { Briefcase, Handshake, Heart, Users, type LucideIcon } from "lucide-react";
import type { GuestCategory } from "@/types/interface";

export interface CategoryMeta {
  value: GuestCategory;
  label: string;
  plural: string;
  icon: LucideIcon;
  /** Couleur des graphiques et pastilles */
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { value: "FAMILLE", label: "Famille", plural: "Familles", icon: Users, color: "#c59d5f" },
  { value: "AMI", label: "Ami", plural: "Amis", icon: Heart, color: "#c9717d" },
  { value: "COLLEGUE", label: "Collègue", plural: "Collègues", icon: Briefcase, color: "#4f7fb8" },
  { value: "CONNAISSANCE", label: "Connaissance", plural: "Connaissances", icon: Handshake, color: "#e08a2c" },
];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [GuestCategory, ...GuestCategory[]];

export function categoryMeta(value: GuestCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}
