"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, Menu, TicketCheck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MusicToggle } from "@/components/layout/MusicToggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { useEventInfo, useSettings } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#maries", label: "Les mariés" },
  { href: "#programme", label: "Programme" },
  { href: "#menu", label: "Menu" },
  { href: "#galerie", label: "Galerie" },
  { href: "#lieu", label: "Lieu" },
  { href: "#livre-dor", label: "Livre d'or" },
];

export function Monogram({ className }: { className?: string }) {
  const event = useEventInfo();
  return (
    <span className={cn("font-display text-2xl font-semibold tracking-wide", className)}>
      {event.groomName[0]}
      <span className="mx-1 font-script text-gold">&</span>
      {event.brideName[0]}
    </span>
  );
}

/** `home` : navigation par ancres + musique. `page` : simple retour vers l'accueil. */
export function SiteHeader({ variant = "home" }: { variant?: "home" | "page" }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Pas de lien vers une section que l'organisateur a masquée
  const showMenuLink = useSettings().data?.menu.visible ?? true;
  const links = LINKS.filter((link) => link.href !== "#menu" || showMenuLink);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="no-print fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
    >
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border px-4 transition-all duration-500 sm:px-6",
          scrolled || menuOpen || variant === "page" ? "glass" : "border-transparent",
        )}
      >
        <Link href="/" aria-label="Accueil" className="flex items-center gap-2">
          {variant === "page" && <ArrowLeft className="size-4 text-gold" />}
          <Monogram />
        </Link>

        {variant === "home" && (
          <nav className="hidden items-center gap-6 xl:flex" aria-label="Sections">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="group relative text-sm text-foreground/80 transition-colors hover:text-foreground">
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <Link href="/ma-carte" className="group relative flex items-center gap-1.5 text-sm text-gold transition-colors hover:text-foreground">
              <TicketCheck className="size-4" />
              Ma carte
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {variant === "home" && <MusicToggle />}
          <ThemeToggle />
          {variant === "home" && (
            <Link href="/rsvp" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
              Confirmer ma présence
            </Link>
          )}
          {variant === "home" && (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="glass grid size-10 shrink-0 place-items-center rounded-full text-gold transition-transform active:scale-95 xl:hidden"
            >
              {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          )}
        </div>
      </div>

      {/* Sous xl : les liens de la barre de navigation sont regroupés dans ce panneau */}
      <AnimatePresence>
        {variant === "home" && menuOpen && (
          <motion.nav
            id="menu-mobile"
            aria-label="Sections"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-w-6xl rounded-3xl border border-border bg-card p-3 shadow-2xl xl:hidden"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 font-display text-xl transition-colors hover:bg-accent"
              >
                {link.label}
              </a>
            ))}
            <Link href="/ma-carte" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-2xl px-4 py-3 font-display text-xl text-gold transition-colors hover:bg-accent">
              <TicketCheck className="size-5" />
              Retrouver ma carte
            </Link>
            <Link href="/livre-dor" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent">
              Signer le livre d&apos;or
            </Link>
            <Link href="/rsvp" onClick={() => setMenuOpen(false)} className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full")}>
              Confirmer ma présence
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
