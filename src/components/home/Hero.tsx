"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CalendarPlus, ChevronDown, MapPin } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Countdown } from "@/components/home/Countdown";
import { FloralCorner, GoldFrame } from "@/components/shared/Ornaments";
import { EASE } from "@/components/shared/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { googleCalendarUrl, wedding, weddingDateLabel, weddingTimeLabel } from "@/config/wedding";
import { useEventInfo } from "@/hooks/useWedding";
import { cn } from "@/lib/utils";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } } };
const item = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } };

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const event = useEventInfo();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Parallaxe : la photo, le texte et les fleurs défilent à des vitesses différentes
  const photoY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 130]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -50]);
  const floralY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 220]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="ambient-bg relative flex min-h-[100svh] items-center overflow-hidden px-6 pb-20 pt-28">
      <motion.div style={{ y: floralY }} className="absolute -bottom-6 -left-8 w-44 opacity-70 sm:w-64" aria-hidden>
        <FloralCorner />
      </motion.div>
      <motion.div style={{ y: floralY }} className="absolute -right-10 top-16 hidden w-52 rotate-[200deg] opacity-50 lg:block" aria-hidden>
        <FloralCorner />
      </motion.div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <motion.div style={{ y: textY, opacity: fade }} variants={container} initial={reduce ? false : "hidden"} animate="show" className="order-2 text-center lg:order-1 lg:text-left">
          <motion.p variants={item} className="text-xs font-medium uppercase tracking-[0.4em] text-gold">
            Nous nous marions
          </motion.p>

          <motion.h1 variants={item} className="mt-5 font-script text-[4.6rem] leading-[0.95] sm:text-8xl lg:text-[7.5rem]">
            {event.groomName}
            <span className="mx-3 inline-block text-[0.5em] text-gold-gradient">&</span>
            <br className="lg:hidden" />
            {event.brideName}
          </motion.h1>

          <motion.p variants={item} className="mt-6 font-display text-2xl italic sm:text-3xl">
            {weddingDateLabel(event.date)} · {weddingTimeLabel(event.date)}
          </motion.p>
          <motion.p variants={item} className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
            <MapPin className="size-4 text-gold" />
            {event.venueName} — {event.venueAddress}
          </motion.p>

          <motion.div variants={item} className="mt-9 flex justify-center lg:justify-start">
            <Countdown />
          </motion.div>

          <motion.div variants={item} className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/rsvp" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Confirmer ma présence
            </Link>
            <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
              <CalendarPlus />
              Ajouter à mon agenda
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: photoY }}
          initial={reduce ? false : { opacity: 0, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.3, ease: EASE }}
          className="order-1 mx-auto w-[min(72vw,20rem)] lg:order-2 lg:w-[24rem]"
        >
          <GoldFrame src={wedding.images.portrait} alt={`${event.groomName} et ${event.brideName}`} priority />
        </motion.div>
      </div>

      <motion.a
        href="#programme"
        aria-label="Découvrir la suite"
        style={{ opacity: fade }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-gold sm:block"
        animate={reduce ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="size-6" />
      </motion.a>
    </section>
  );
}
