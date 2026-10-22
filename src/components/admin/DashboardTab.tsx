"use client";

import { Armchair, Ban, DoorOpen, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/admin/KpiCard";
import { Box, EmptyState, Pill, Section, SettingRow } from "@/components/admin/ui";
import { CATEGORIES } from "@/config/categories";
import { wedding } from "@/config/wedding";
import { useRsvps, useSettings, useTableLabel } from "@/hooks/useWedding";
import { displayName, formatDateTime, personnes } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--foreground)",
  fontSize: 13,
};

export function DashboardTab() {
  const { data: allGuests = [] } = useRsvps();
  const { data: settings } = useSettings();
  const tableName = useTableLabel();
  const capacity = settings?.capacity ?? wedding.capacity;

  const stats = useMemo(() => {
    // Les invitations révoquées ne comptent dans aucun total
    const guests = allGuests.filter((g) => !g.isRevoked);
    const confirmed = guests.reduce((s, g) => s + g.nombrePersonnes, 0);
    const arrived = guests.filter((g) => g.isVerified);
    const byCategory = CATEGORIES.map((c) => {
      const list = guests.filter((g) => g.categorie === c.value);
      return { ...c, inscrits: list.length, personnes: list.reduce((s, g) => s + g.nombrePersonnes, 0) };
    });

    // Cumul des personnes confirmées, jour après jour
    const perDay = new Map<string, number>();
    [...guests].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((g) => {
      const day = g.createdAt.slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + g.nombrePersonnes);
    });
    let running = 0;
    const timeline = [...perDay.entries()].map(([day, n]) => {
      running += n;
      return { jour: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(day)), personnes: running };
    });

    return {
      guests,
      confirmed,
      revoked: allGuests.length - guests.length,
      arrivedInvitations: arrived.length,
      arrivedPersons: arrived.reduce((s, g) => s + g.nombrePersonnes, 0),
      byCategory,
      timeline,
    };
  }, [allGuests]);

  const remaining = Math.max(0, capacity - stats.confirmed);
  const entryRate = stats.confirmed ? Math.round((stats.arrivedPersons / stats.confirmed) * 100) : 0;

  return (
    <>
      <Section title="Vue d'ensemble">
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon={Ticket} label="Inscrits" value={stats.guests.length} hint="invitations confirmées" />
          <KpiCard icon={Users} label="Personnes" value={stats.confirmed} hint={`sur ${capacity} places`} />
          <KpiCard icon={Armchair} label="Places restantes" value={remaining} hint={remaining === 0 ? "réservations clôturées" : "encore disponibles"} color="var(--warning)" />
          <KpiCard icon={DoorOpen} label="Entrées validées" value={stats.arrivedPersons} hint={`${stats.arrivedInvitations} invitation${stats.arrivedInvitations > 1 ? "s" : ""} scannée${stats.arrivedInvitations > 1 ? "s" : ""}`} color="var(--success)" />
          {stats.byCategory.map((c) => (
            <KpiCard key={c.value} icon={c.icon} label={c.plural} value={c.inscrits} hint={personnes(c.personnes)} color={c.color} />
          ))}
        </div>
        {stats.revoked > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Ban className="size-4" />
            {stats.revoked} invitation{stats.revoked > 1 ? "s" : ""} révoquée{stats.revoked > 1 ? "s" : ""}, non comptée{stats.revoked > 1 ? "s" : ""} ci-dessus.
          </p>
        )}
      </Section>

      <Section title="Jour J en direct">
        <SettingRow
          title={`${stats.arrivedPersons} personnes entrées sur ${stats.confirmed}`}
          description="Se met à jour à chaque entrée validée, y compris depuis un autre onglet ouvert sur le contrôle des entrées."
        >
          <div className="flex w-full items-center gap-3 sm:w-64">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success transition-[width] duration-700" style={{ width: `${entryRate}%` }} />
            </div>
            <span className="w-10 text-right text-sm font-medium tabular-nums">{entryRate}%</span>
          </div>
        </SettingRow>
      </Section>

      <Section title="Confirmations">
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <Box>
            <p className="text-sm text-muted-foreground">Cumul des personnes confirmées</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="jour" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, capacity]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="personnes" name="Personnes" stroke="var(--gold)" strokeWidth={2} fill="url(#goldFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Box>

          <Box>
            <p className="text-sm text-muted-foreground">Personnes par catégorie</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.byCategory} dataKey="personnes" nameKey="plural" innerRadius={42} outerRadius={68} paddingAngle={3} stroke="none">
                    {stats.byCategory.map((c) => (
                      <Cell key={c.value} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {stats.byCategory.map((c) => (
                <li key={c.value} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate text-muted-foreground">{c.plural}</span>
                  <span className="ml-auto font-medium tabular-nums">{c.personnes}</span>
                </li>
              ))}
            </ul>
          </Box>
        </div>
      </Section>

      <Section
        title="Dernières confirmations"
        action={
          <Link href="/admin?tab=invites" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Voir tous les invités
          </Link>
        }
      >
        {stats.guests.slice(0, 5).map((g) => (
          <SettingRow key={g.id} title={displayName(g)} description={`${personnes(g.nombrePersonnes)} · ${tableName(g.tableNumero)} · ${formatDateTime(g.createdAt)}`}>
            {g.isVerified ? <Pill tone="success">Arrivé</Pill> : <Pill>En attente</Pill>}
          </SettingRow>
        ))}
        {stats.guests.length === 0 && <EmptyState>Aucune confirmation pour l&apos;instant.</EmptyState>}
      </Section>
    </>
  );
}
