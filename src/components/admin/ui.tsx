"use client";

// Briques de l'interface de gestion, façon panneau de réglages : des sections titrées,
// faites de lignes « titre + description à gauche, contrôle à droite » séparées par un filet.

import { Minus, Plus } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mb-10", className)}>
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SettingRow({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-border py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8", className)}>
      <div className="min-w-0">
        <p className="text-[15px] font-medium">{title}</p>
        {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

/** Encadré fin et plat (graphiques, tables) */
export function Box({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>{children}</div>;
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200", checked && "translate-x-5")} />
    </button>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-0.5 [scrollbar-width:none]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
            value === option.value ? "border border-border bg-card font-medium shadow-xs" : "border border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface NumberFieldProps {
  value: number;
  /** Renvoie `false` si la valeur a été refusée : le champ revient alors à la valeur enregistrée */
  onCommit: (value: number) => Promise<boolean> | boolean;
  min: number;
  max: number;
  label: string;
  disabled?: boolean;
}

/** Nombre avec boutons − / + ; la saisie au clavier est validée en quittant le champ ou avec Entrée */
export function NumberField({ value, onCommit, min, max, label, disabled }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = async (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next)));
    setDraft(null);
    if (!Number.isFinite(clamped) || clamped === value) return;
    await onCommit(clamped);
  };

  const stepClass = "grid size-9 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-input bg-card">
      <button type="button" aria-label={`Diminuer : ${label}`} disabled={disabled || value <= min} onClick={() => commit(value - 1)} className={stepClass}>
        <Minus className="size-4" />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        disabled={disabled}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={() => draft !== null && commit(Number(draft))}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-9 w-14 border-x border-input bg-transparent text-center text-sm font-medium tabular-nums outline-none focus:bg-accent/60"
      />
      <button type="button" aria-label={`Augmenter : ${label}`} disabled={disabled || value >= max} onClick={() => commit(value + 1)} className={stepClass}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive sm:w-72",
        className,
      )}
      {...props}
    />
  );
}

/** Pastille d'état */
export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger"; children: ReactNode }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/12 text-destructive",
  };
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function IconButton({ label, onClick, children, tone, disabled }: { label: string; onClick: () => void; children: ReactNode; tone?: "danger" | "success"; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40",
        tone === "danger" ? "hover:text-destructive" : tone === "success" ? "hover:text-success" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="border-b border-border py-12 text-center text-sm text-muted-foreground last:border-0">{children}</p>;
}
