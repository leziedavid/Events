import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Flower({ x, y, r, deep }: { x: number; y: number; r: number; deep?: boolean }) {
  const fill = deep ? "var(--blossom-deep)" : "var(--blossom)";
  return (
    <g>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx={x} cy={y - r * 0.62} rx={r * 0.46} ry={r * 0.68} fill={fill} opacity={0.82} transform={`rotate(${angle} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r * 0.24} fill="var(--gold-soft)" />
    </g>
  );
}

const LEAVES: [x: number, y: number, angle: number, size: number][] = [
  [44, 150, -35, 17], [70, 128, -62, 15], [58, 172, 8, 14], [94, 96, -70, 14], [106, 62, -78, 12],
  [88, 154, -18, 16], [124, 138, -30, 15], [152, 116, -42, 13], [30, 126, -80, 12],
];

/** Bouquet aquarellé dessiné en SVG (pas d'image à charger) — purement décoratif */
export function FloralCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden className={cn("pointer-events-none select-none", className)}>
      <path d="M18 186C56 152 92 110 112 34" stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M34 172C82 164 132 142 176 98" stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {LEAVES.map(([x, y, angle, size], i) => (
        <ellipse key={i} cx={x} cy={y} rx={size} ry={size * 0.36} fill="var(--leaf)" opacity={0.55 + (i % 3) * 0.12} transform={`rotate(${angle} ${x} ${y})`} />
      ))}
      <Flower x={62} y={142} r={25} />
      <Flower x={104} y={156} r={18} deep />
      <Flower x={40} y={104} r={13} deep />
      <circle cx={118} cy={30} r={4} fill="var(--blossom)" opacity={0.8} />
      <circle cx={180} cy={94} r={4} fill="var(--blossom-deep)" opacity={0.7} />
    </svg>
  );
}

/** Filet doré avec losange central */
export function Divider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-3 text-gold", className)}>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold" />
      <span className="size-1.5 rotate-45 bg-gold" />
      <span className="size-2.5 rotate-45 border border-gold" />
      <span className="size-1.5 rotate-45 bg-gold" />
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold" />
    </div>
  );
}

/** Titre de section : surtitre en capitales, titre serif, filet doré */
export function SectionTitle({ eyebrow, title, children, className }: { eyebrow: string; title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-medium sm:text-5xl">{title}</h2>
      <Divider className="mt-5" />
      {children && <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{children}</p>}
    </div>
  );
}

/**
 * Photo dans un double cadre doré incliné, avec bouquets aux angles — reprise du faire-part
 * de référence.
 */
export function GoldFrame({ src, alt, priority, className }: { src: string; alt: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <span aria-hidden className="absolute -inset-4 rotate-[4deg] border border-gold/70 sm:-inset-5" />
      <span aria-hidden className="absolute -inset-4 -rotate-[3deg] border border-gold/45 sm:-inset-5" />
      <div className="relative aspect-[4/5] overflow-hidden bg-navy shadow-[0_30px_70px_-30px_rgba(10,20,38,0.8)]">
        <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 1024px) 80vw, 460px" className="object-cover" />
      </div>
      <FloralCorner className="absolute -bottom-12 -left-14 w-40 sm:-left-20 sm:w-52" />
      <FloralCorner className="absolute -right-12 -top-12 w-32 rotate-180 sm:-right-16 sm:w-40" />
    </div>
  );
}
