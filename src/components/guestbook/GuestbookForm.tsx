"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useAddGuestbookMessage, useSettings } from "@/hooks/useWedding";
import { guestbookSchema, type GuestbookInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** Formulaire du livre d'or, partagé par l'accueil et la page /livre-dor (ouverte par QR Code) */
export function GuestbookForm({ className, onSent }: { className?: string; onSent?: () => void }) {
  const add = useAddGuestbookMessage();
  const { data: settings } = useSettings();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GuestbookInput>({
    resolver: zodResolver(guestbookSchema),
    defaultValues: { auteur: "", message: "" },
  });

  const onSubmit = handleSubmit((values) =>
    add.mutate(values, {
      onSuccess: () => {
        toast.success("Merci pour votre message !");
        reset();
        onSent?.();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (settings && !settings.guestbookOpen) {
    return (
      <div className={cn("text-center", className)}>
        <Lock className="mx-auto size-8 text-gold" />
        <p className="mt-3 font-display text-2xl">Le livre d&apos;or est fermé pour le moment.</p>
        <p className="mt-1 text-sm text-muted-foreground">Merci pour tous vos messages !</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("space-y-5", className)}>
      <Field label="Votre nom" htmlFor="gb-auteur" error={errors.auteur?.message}>
        <Input id="gb-auteur" autoComplete="name" placeholder="Ex. Tante Adjoua" aria-invalid={!!errors.auteur} {...register("auteur")} />
      </Field>
      <Field label="Votre message" htmlFor="gb-message" error={errors.message?.message} hint="280 caractères maximum">
        <Textarea id="gb-message" placeholder="Tous nos vœux de bonheur…" aria-invalid={!!errors.message} {...register("message")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={add.isPending}>
        {!add.isPending && <Send />}
        Signer le livre d&apos;or
      </Button>
    </form>
  );
}
