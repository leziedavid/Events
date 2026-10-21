"use client";

import { ChefHat, UtensilsCrossed } from "lucide-react";
import { Divider, SectionTitle } from "@/components/shared/Ornaments";
import { Reveal } from "@/components/shared/Reveal";
import { MENU_CATEGORIES } from "@/data/menu";
import { useMenu, useSettings } from "@/hooks/useWedding";
import type { MenuItem, MenuSettings } from "@/types/interface";

/** Plats visibles regroupés par catégorie, dans l'ordre de la carte */
export function groupMenu(menu: MenuItem[]) {
  return MENU_CATEGORIES.map((c) => ({ ...c, items: menu.filter((m) => m.categorie === c.value && m.visible) })).filter((g) => g.items.length > 0);
}

/**
 * Le menu présenté comme une carte de restaurant. Partagé par la section de l'accueil et par
 * la page /menu (QR Code « Le menu »), pour un rendu identique.
 */
export function MenuBoard({ menu, settings }: { menu: MenuItem[]; settings: Pick<MenuSettings, "catering" | "catererName"> }) {
  const groups = groupMenu(menu);
  const { catering, catererName } = settings;

  return (
    <Reveal scale={0.97} className="glass relative mx-auto max-w-5xl rounded-[2rem] px-5 py-9 sm:px-12 sm:py-14">
      <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-gold/25" />

      <p className="relative mx-auto flex w-fit max-w-full items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-center text-sm">
        {catering ? <ChefHat className="size-4 shrink-0 text-gold" /> : <UtensilsCrossed className="size-4 shrink-0 text-gold" />}
        {catering
          ? `Repas servi à table${catererName ? ` par notre traiteur, ${catererName}` : " par notre traiteur"}`
          : "Buffet préparé avec amour par nos familles — servez-vous librement"}
      </p>

      <div className="relative mt-10 gap-x-14 md:columns-2">
        {groups.map((group, i) => (
          <Reveal key={group.value} delay={Math.min(i * 0.08, 0.3)} className="mb-10 break-inside-avoid text-center">
            <h2 className="font-script text-4xl text-gold-gradient">{group.plural}</h2>
            <Divider className="mt-2" />
            <ul className="mt-5 space-y-5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <p className="font-display text-2xl leading-tight">{item.nom}</p>
                  {item.description && <p className="mx-auto mt-1 max-w-sm text-sm italic leading-relaxed text-muted-foreground">{item.description}</p>}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      <p className="relative text-center text-xs text-muted-foreground">
        Une allergie ou un régime particulier ? Signalez-le aux mariés avant le jour J.
      </p>
    </Reveal>
  );
}

/** Section « Le menu » de l'accueil. Gérée dans /admin?tab=menu. */
export function MenuSection() {
  const { data: menu = [] } = useMenu();
  const { data: settings } = useSettings();

  // Rien à montrer tant que les données ne sont pas chargées, ou si l'organisateur a masqué le menu
  if (!settings?.menu.visible || groupMenu(menu).length === 0) return null;

  return (
    <section id="menu" className="px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="À table" title="Le menu">
        Les saveurs de chez nous pour célébrer ce grand jour. Voici ce qui vous attend à la réception.
      </SectionTitle>
      <div className="mt-14">
        <MenuBoard menu={menu} settings={settings.menu} />
      </div>
    </section>
  );
}
