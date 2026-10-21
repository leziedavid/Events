"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { login } from "@/api/auth-api";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Divider } from "@/components/shared/Ornaments";
import { EASE } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifiant: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await login(input);
      if (!res.data) throw new Error(res.message || "Connexion impossible.");
      return res.data;
    },
    onSuccess: ({ tokens, user }) => {
      signIn(tokens, user);
      toast.success(`Bienvenue, ${user.name}`);
      // Lu sans useSearchParams pour ne pas imposer de frontière Suspense à la page
      const next = new URLSearchParams(window.location.search).get("next");
      const home = user.role === "ADMIN" ? "/admin" : "/verification";
      // L'agent n'a pas accès à /admin : inutile de l'y renvoyer
      router.replace(next && next.startsWith("/") && (user.role === "ADMIN" || !next.startsWith("/admin")) ? next : home);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <SiteHeader variant="page" />
      <main className="ambient-bg grid min-h-[100svh] place-items-center px-4 pb-12 pt-28">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold/15 text-gold">
            <KeyRound className="size-6" />
          </span>
          <h1 className="mt-4 text-center font-display text-4xl font-medium">Espace organisateurs</h1>
          <Divider className="mt-4" />

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="mt-7 space-y-5">
            <Field label="Identifiant" htmlFor="login-id" error={errors.identifiant?.message}>
              <Input id="login-id" autoComplete="username" autoCapitalize="none" aria-invalid={!!errors.identifiant} {...register("identifiant")} />
            </Field>
            <Field label="Mot de passe" htmlFor="login-pw" error={errors.password?.message}>
              <Input id="login-pw" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
              Se connecter
            </Button>
          </form>

        </motion.div>
      </main>
    </>
  );
}
