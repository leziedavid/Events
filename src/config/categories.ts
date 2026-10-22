import { Briefcase, Church, Handshake, Heart, Users, type LucideIcon } from "lucide-react";
import type { GuestCategory } from "@/types/interface";

export interface CategoryMeta {
  value: GuestCategory;
  label: string;
  plural: string;
  /** Libellé du bouton du formulaire de présence */
  formLabel: string;
  icon: LucideIcon;
  /** Couleur des graphiques et pastilles */
  color: string;
  /** Proposée dans le formulaire ; les autres restent connues pour les invitations qui les portent */
  selectable: boolean;
}

/**
 * Catégories d'invités : elles indiquent le lien avec les mariés (information interne, jamais
 * imprimée sur la carte) et décident des tables proposées. Famille et Responsables de l'Église
 * ont accès aux tables VIP 1 et VIP 2 ; Amis, Collègues et Connaissances non (règle aussi
 * appliquée par l'API).
 */
export const CATEGORIES: CategoryMeta[] = [
  { value: "FAMILLE", label: "Famille", plural: "Familles", formLabel: "Famille", icon: Users, color: "#c59d5f", selectable: true },
  { value: "AMI", label: "Ami", plural: "Amis", formLabel: "Amis", icon: Heart, color: "#c9717d", selectable: true },
  { value: "COLLEGUE", label: "Collègue", plural: "Collègues", formLabel: "Collègue", icon: Briefcase, color: "#4f7fb8", selectable: true },
  { value: "CONNAISSANCE", label: "Connaissance", plural: "Connaissances", formLabel: "Connaissance", icon: Handshake, color: "#e08a2c", selectable: true },
  {
    value: "EGLISE",
    label: "Responsable de l'Église",
    plural: "Responsables de l'Église",
    formLabel: "Responsables de l'Église",
    icon: Church,
    color: "#7a5c8e",
    selectable: true,
  },
];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [GuestCategory, ...GuestCategory[]];

export function categoryMeta(value: GuestCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}
