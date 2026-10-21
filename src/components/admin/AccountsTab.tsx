"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Pencil, ScanLine, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import type { AccountView } from "@/api/accounts-api";
import { EmptyState, IconButton, Pill, Section, Switch } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Modal } from "@/components/ui/MotionModal";
import { useAccounts, useCreateAccount, useDeleteAccount, useSetAccountPassword, useUpdateAccount } from "@/hooks/useWedding";
import { accountSchema, newAccountSchema, passwordSchema, type AccountInput, type NewAccountInput, type PasswordInput } from "@/lib/schemas";
import { formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/interface";

const ROLES: Record<UserRole, { label: string; plural: string; description: string; icon: typeof ShieldCheck }> = {
  ADMIN: { label: "Administrateur", plural: "Administrateurs", description: "Accès complet à la gestion et au contrôle des entrées.", icon: ShieldCheck },
  AGENT: { label: "Agent d'accueil", plural: "Agents d'accueil", description: "Accès au seul contrôle des entrées (scan des cartes).", icon: ScanLine },
};

const editAccountSchema = accountSchema.extend({ password: z.string() });

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive";

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="mt-1 text-xs text-destructive">{message}</p> : null;
}

/** Nom, identifiant, rôle — et mot de passe à la création */
function AccountForm({ account, onSubmit, loading }: { account?: AccountView; onSubmit: (values: NewAccountInput) => void; loading: boolean }) {
  const isNew = !account;
  const { register, handleSubmit, formState: { errors } } = useForm<NewAccountInput>({
    // En modification, le mot de passe se change à part (bouton clé) : il n'est pas validé ici
    resolver: zodResolver(isNew ? newAccountSchema : editAccountSchema),
    defaultValues: { name: account?.name ?? "", identifiant: account?.identifiant ?? "", role: account?.role ?? "AGENT", password: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="acc-name" className="text-sm font-medium">Nom affiché</label>
        <input id="acc-name" placeholder="Ex. Agent porte principale" aria-invalid={!!errors.name} className={`${fieldClass} h-10`} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>
      <div>
        <label htmlFor="acc-id" className="text-sm font-medium">Identifiant de connexion</label>
        <input id="acc-id" autoCapitalize="none" spellCheck={false} placeholder="ex. agent2" aria-invalid={!!errors.identifiant} className={`${fieldClass} h-10 font-mono`} {...register("identifiant")} />
        <FieldError message={errors.identifiant?.message} />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Rôle</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {(Object.keys(ROLES) as UserRole[]).map((role) => {
            const { label, description, icon: Icon } = ROLES[role];
            return (
              <label key={role} className="flex cursor-pointer gap-3 rounded-lg border border-input p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/8">
                <input type="radio" value={role} className="mt-1 accent-[var(--primary)]" {...register("role")} />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Icon className="size-4 text-primary" /> {label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {isNew && (
        <div>
          <label htmlFor="acc-pw" className="text-sm font-medium">Mot de passe</label>
          <input id="acc-pw" type="password" autoComplete="new-password" aria-invalid={!!errors.password} className={`${fieldClass} h-10`} {...register("password")} />
          <FieldError message={errors.password?.message ?? undefined} />
          {!errors.password && <p className="mt-1 text-xs text-muted-foreground">8 caractères minimum. Communiquez-le à la personne concernée.</p>}
        </div>
      )}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" loading={loading}>
          {isNew ? "Créer le compte" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm({ onSubmit, loading }: { onSubmit: (values: PasswordInput) => void; loading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema), defaultValues: { password: "" } });
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="acc-new-pw" className="text-sm font-medium">Nouveau mot de passe</label>
        <input id="acc-new-pw" type="password" autoComplete="new-password" aria-invalid={!!errors.password} className={`${fieldClass} h-10`} {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={loading}>
          Changer le mot de passe
        </Button>
      </div>
    </form>
  );
}

type Dialog = { type: "create" } | { type: "edit" | "password" | "delete"; account: AccountView } | null;

/** Onglet « Comptes » : administrateurs et agents d'accueil */
export function AccountsTab() {
  const { data: accounts = [], isLoading } = useAccounts();
  const user = useAuthStore((s) => s.user);
  // Jamais de suppression ni de désactivation de son propre compte (l'API le refuse aussi)
  const currentUserId = user?.id;
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const setPassword = useSetAccountPassword();
  const remove = useDeleteAccount();
  const [dialog, setDialog] = useState<Dialog>(null);

  const close = () => setDialog(null);
  const onError = (e: Error) => toast.error(e.message);
  const done = (message: string) => () => {
    toast.success(message);
    close();
  };
  const toInput = (a: AccountView): AccountInput => ({ name: a.name, identifiant: a.identifiant, role: a.role });

  const groups = (["ADMIN", "AGENT"] as UserRole[]).map((role) => ({ role, list: accounts.filter((a) => a.role === role) }));

  return (
    <>
      <Section
        title="Comptes"
        description="Les administrateurs accèdent à toute la gestion ; les agents d'accueil uniquement au contrôle des entrées. Un compte désactivé ne peut plus se connecter."
        action={
          <Button size="sm" onClick={() => setDialog({ type: "create" })}>
            <UserPlus />
            Ajouter un compte
          </Button>
        }
      >
        {groups.map(({ role, list }) => (
          <div key={role} className="mt-5">
            <p className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {ROLES[role].plural} <Pill>{list.length}</Pill>
            </p>
            {list.map((account) => {
              const Icon = ROLES[account.role].icon;
              const isMe = account.id === currentUserId;
              return (
                <div key={account.id} className="flex items-center gap-3 border-b border-border py-4 last:border-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className={account.active ? "min-w-0 flex-1" : "min-w-0 flex-1 opacity-55"}>
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
                      <span className="truncate">{account.name}</span>
                      {isMe && <Pill tone="success">Vous</Pill>}
                      {account.isOwner && <Pill>Propriétaire</Pill>}
                      {!account.active && <Pill tone="danger">Désactivé</Pill>}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      <span className="font-mono">{account.identifiant}</span> · créé le {formatDateTime(account.createdAt)}
                    </p>
                  </div>
                  <Switch
                    label={`${account.active ? "Désactiver" : "Activer"} ${account.name}`}
                    checked={account.active}
                    disabled={update.isPending || isMe || account.isOwner}
                    onChange={(active) =>
                      update.mutate({ id: account.id, input: { ...toInput(account), active } }, { onSuccess: () => toast.success(active ? "Compte activé" : "Compte désactivé"), onError })
                    }
                  />
                  <div className="flex shrink-0 items-center">
                    <IconButton label={`Modifier ${account.name}`} onClick={() => setDialog({ type: "edit", account })}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label={`Changer le mot de passe de ${account.name}`} onClick={() => setDialog({ type: "password", account })}>
                      <KeyRound className="size-4" />
                    </IconButton>
                    <IconButton label={`Supprimer ${account.name}`} tone="danger" disabled={isMe || account.isOwner} onClick={() => setDialog({ type: "delete", account })}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
            {list.length === 0 && <EmptyState>{isLoading ? "Chargement…" : "Aucun compte."}</EmptyState>}
          </div>
        ))}
        <p className="mt-6 text-xs text-muted-foreground">
          Les mots de passe sont chiffrés par le serveur et ne sont jamais affichés. Changer le mot de passe d&apos;un compte le déconnecte de tous ses appareils. Le propriétaire de l&apos;événement ne peut être ni désactivé ni supprimé.
        </p>
      </Section>

      <Modal open={dialog?.type === "create"} onClose={close} title="Ajouter un compte" size="sm">
        <AccountForm loading={create.isPending} onSubmit={(values) => create.mutate(values, { onSuccess: done("Compte créé"), onError })} />
      </Modal>

      <Modal open={dialog?.type === "edit"} onClose={close} title="Modifier le compte" size="sm">
        {dialog?.type === "edit" && (
          <AccountForm
            key={dialog.account.id}
            account={dialog.account}
            loading={update.isPending}
            onSubmit={(values) =>
              update.mutate(
                { id: dialog.account.id, input: { name: values.name, identifiant: values.identifiant, role: values.role, active: dialog.account.active } },
                { onSuccess: done("Compte modifié"), onError },
              )
            }
          />
        )}
      </Modal>

      <Modal open={dialog?.type === "password"} onClose={close} title="Changer le mot de passe" description={dialog?.type === "password" ? dialog.account.name : undefined} size="sm">
        {dialog?.type === "password" && (
          <PasswordForm
            key={dialog.account.id}
            loading={setPassword.isPending}
            onSubmit={({ password }) => setPassword.mutate({ id: dialog.account.id, password }, { onSuccess: done("Mot de passe modifié"), onError })}
          />
        )}
      </Modal>

      <ConfirmAction
        open={dialog?.type === "delete"}
        onClose={close}
        title="Supprimer ce compte ?"
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() => dialog?.type === "delete" && remove.mutate(dialog.account.id, { onSuccess: done("Compte supprimé"), onError })}
      >
        {dialog?.type === "delete" && (
          <>
            <strong className="text-foreground">{dialog.account.name}</strong> ({dialog.account.identifiant}) ne pourra plus se connecter. Pour une suspension temporaire,
            préférez l&apos;interrupteur.
          </>
        )}
      </ConfirmAction>
    </>
  );
}
