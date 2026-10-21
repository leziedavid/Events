"use client";

import { motion } from "framer-motion";
import { Loader2, RotateCw, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { MenuBoard, groupMenu } from "@/components/home/MenuSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Divider } from "@/components/shared/Ornaments";
import { EASE } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { defaultSettings, weddingTitle } from "@/config/wedding";
import { useEventInfo, useMenu, useSettings } from "@/hooks/useWedding";

// Page ouverte par le QR Code « Le menu » (posé sur les tables ou imprimé sur les supports) :
// pensée pour le téléphone. Elle affiche les plats visibles de /admin?tab=menu, même si la
// section Menu est masquée sur l'accueil : c'est l'organisateur qui décide d'imprimer ce QR Code.
export default function MenuPage() {
  const menu = useMenu();
  const settings = useSettings();
  const title = weddingTitle(useEventInfo());

  const groups = groupMenu(menu.data ?? []);
  const loading = menu.isPending || settings.isPending;
  // Un rafraîchissement raté (réseau mobile instable) ne doit pas effacer un menu déjà affiché
  const failed = (menu.isError && !menu.data) || (settings.isError && !settings.data);

  return (
    <>
      <SiteHeader variant="page" />
      <main className="ambient-bg relative min-h-[100svh] overflow-hidden px-4 pb-16 pt-28 sm:px-6">
        <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="mx-auto max-w-xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold/15 text-gold">
            <UtensilsCrossed className="size-6" />
          </span>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.35em] text-gold">{title}</p>
          <h1 className="mt-2 font-display text-4xl font-medium sm:text-5xl">Le menu</h1>
          <Divider className="mt-4" />
          <p className="mt-4 text-[15px] text-muted-foreground">Les saveurs de chez nous pour célébrer ce grand jour.</p>
        </motion.header>

        <div className="relative mx-auto mt-10 max-w-5xl">
          {loading ? (
            <div role="status" className="glass mx-auto flex max-w-xl items-center justify-center gap-3 rounded-3xl p-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-gold" />
              Chargement du menu…
            </div>
          ) : failed ? (
            <div role="alert" className="glass mx-auto max-w-xl rounded-3xl p-8 text-center">
              <p className="font-display text-2xl">Le menu n&apos;a pas pu être chargé</p>
              <p className="mt-2 text-sm text-muted-foreground">{(menu.error ?? settings.error)?.message ?? "Vérifiez votre connexion internet puis réessayez."}</p>
              <Button
                variant="outline"
                className="mt-6"
                loading={menu.isFetching || settings.isFetching}
                onClick={() => {
                  void menu.refetch();
                  void settings.refetch();
                }}
              >
                {!(menu.isFetching || settings.isFetching) && <RotateCw />}
                Réessayer
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <div className="glass mx-auto max-w-xl rounded-3xl p-8 text-center">
              <p className="font-display text-2xl">Le menu arrive bientôt</p>
              <p className="mt-2 text-sm text-muted-foreground">Les mariés finalisent encore la carte du repas. Revenez un peu plus tard !</p>
            </div>
          ) : (
            <MenuBoard menu={menu.data ?? []} settings={settings.data?.menu ?? defaultSettings.menu} />
          )}
        </div>

        <p className="mt-10 text-center">
          <Link href="/" className="text-sm text-gold underline-offset-4 hover:underline">
            Découvrir le site du mariage
          </Link>
        </p>
      </main>
    </>
  );
}
