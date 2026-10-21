"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Armchair, BellRing, BookHeart, Database, ExternalLink, History, CalendarClock, LayoutDashboard, LogOut, Menu, PanelsTopLeft, QrCode, ScanLine, Search, Settings2, UserCog, Users, UtensilsCrossed, X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ComponentType } from "react";
import { AccountsTab } from "@/components/admin/AccountsTab";
import { GuestbookTab, RemindersTab } from "@/components/admin/CommunicationTab";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { GuestsTab } from "@/components/admin/GuestsTab";
import { HomeTab } from "@/components/admin/HomeTab";
import { ProgrammeTab } from "@/components/admin/ProgrammeTab";
import { QrTab } from "@/components/admin/QrTab";
import { MenuTab } from "@/components/admin/MenuTab";
import { ScansTab } from "@/components/admin/ScansTab";
import { DataTab, SettingsTab } from "@/components/admin/SettingsTab";
import { TablesTab } from "@/components/admin/TablesTab";
import { ThemeToggle } from "@/components/theme-toggle";
import { weddingTitle } from "@/config/wedding";
import { useEventInfo } from "@/hooks/useWedding";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
}

// Menu groupé, comme un panneau de réglages : gestion courante, communication, configuration
const GROUPS: { label: string; tabs: Tab[] }[] = [
  {
    label: "Gestion",
    tabs: [
      { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, component: DashboardTab },
      { id: "invites", label: "Invités", icon: Users, component: GuestsTab },
      { id: "tables", label: "Tables", icon: Armchair, component: TablesTab },
      { id: "scans", label: "Entrées", icon: History, component: ScansTab },
      { id: "menu", label: "Menu du repas", icon: UtensilsCrossed, component: MenuTab },
    ],
  },
  {
    label: "Communication",
    tabs: [
      { id: "rappels", label: "Rappels", icon: BellRing, component: RemindersTab },
      { id: "livre-dor", label: "Livre d'or", icon: BookHeart, component: GuestbookTab },
      { id: "qr-codes", label: "QR Codes", icon: QrCode, component: QrTab },
    ],
  },
  {
    label: "Configuration",
    tabs: [
      { id: "accueil", label: "Page d'accueil", icon: PanelsTopLeft, component: HomeTab },
      { id: "programme", label: "Programme", icon: CalendarClock, component: ProgrammeTab },
      { id: "evenement", label: "Événement", icon: Settings2, component: SettingsTab },
      { id: "comptes", label: "Comptes", icon: UserCog, component: AccountsTab },
      { id: "donnees", label: "Données", icon: Database, component: DataTab },
    ],
  },
];

const TABS = GROUPS.flatMap((g) => g.tabs);
const itemClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors";
const idleClass = "text-foreground/80 hover:bg-accent/70 hover:text-foreground";

function Sidebar({ activeId, onNavigate, onSignOut }: { activeId: string; onNavigate?: () => void; onSignOut: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = GROUPS.map((g) => ({ ...g, tabs: g.tabs.filter((t) => t.label.toLowerCase().includes(q)) })).filter((g) => g.tabs.length > 0);

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher"
          aria-label="Rechercher dans le menu"
          className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-ring/30"
        />
      </div>

      <nav aria-label="Administration" className="flex-1">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 pb-1.5 pt-2 text-xs text-muted-foreground">{group.label}</p>
            {group.tabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/admin?tab=${tab.id}`}
                onClick={onNavigate}
                aria-current={tab.id === activeId ? "page" : undefined}
                className={cn(itemClass, tab.id === activeId ? "bg-accent font-medium text-foreground" : idleClass)}
              >
                <tab.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                <span className="truncate">{tab.label}</span>
              </Link>
            ))}
          </div>
        ))}
        {groups.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Aucun résultat.</p>}

        <div className="mb-2">
          <p className="px-3 pb-1.5 pt-2 text-xs text-muted-foreground">Accès</p>
          <Link href="/verification" className={cn(itemClass, idleClass)}>
            <ScanLine className="size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="truncate">Contrôle des entrées</span>
          </Link>
          <Link href="/" className={cn(itemClass, idleClass)}>
            <ExternalLink className="size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="truncate">Voir le site</span>
          </Link>
          <button type="button" onClick={onSignOut} className={cn(itemClass, idleClass)}>
            <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="truncate">Se déconnecter</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

const quietToggle = "size-9 border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-accent";

function AdminContent() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const title = weddingTitle(useEventInfo());
  // L'onglet vit dans l'URL (?tab=) : il survit au rechargement et se partage par lien
  const tabId = useSearchParams().get("tab");
  const active = TABS.find((t) => t.id === tabId) ?? TABS[0];
  const ActiveTab = active.component;

  const signOut = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="admin-ui min-h-[100svh] bg-background text-foreground lg:flex">
      <aside className="no-print hidden w-60 shrink-0 border-r border-border bg-[var(--admin-sidebar)] lg:sticky lg:top-0 lg:block lg:h-screen">
        <Sidebar activeId={active.id} onSignOut={signOut} />
      </aside>

      {/* Mobile et tablette : le même menu, dans un tiroir ouvert par le bouton ☰ */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[900] lg:hidden">
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-border bg-[var(--admin-sidebar)] shadow-2xl"
            >
              <Sidebar activeId={active.id} onNavigate={() => setMenuOpen(false)} onSignOut={signOut} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background px-3 py-2 lg:border-0 lg:px-6 lg:pt-4">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu" className="grid size-9 place-items-center rounded-lg text-foreground hover:bg-accent lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-[15px] font-semibold">{active.label}</p>
            <p className="truncate text-xs text-muted-foreground">{title}</p>
          </div>
          <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground lg:block">
            {title}
            {mounted && user ? ` · ${user.name}` : ""}
          </p>
          <ThemeToggle className={quietToggle} />
          <Link href="/" aria-label="Fermer la gestion et revenir au site" title="Revenir au site" className="hidden size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:grid">
            <X className="size-5" />
          </Link>
        </header>

        {/* Entrée animée seulement : un onglet ne doit jamais attendre la sortie du précédent */}
        <motion.main key={active.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-5xl px-4 py-6 sm:px-8 lg:px-10 lg:pt-4">
          <ActiveTab />
        </motion.main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  // useSearchParams impose une frontière Suspense au build
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}
