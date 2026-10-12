"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState, IconButton, Pill, Section, Segmented, SettingRow, Switch, TextInput } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Modal } from "@/components/ui/MotionModal";
import { MENU_CATEGORIES } from "@/data/menu";
import { useCreateMenuItem, useDeleteMenuItem, useMenu, useSettings, useUpdateMenuItem, useUpdateSettings } from "@/hooks/useWedding";
import { menuItemSchema, type MenuItemInput } from "@/lib/schemas";
import type { MenuItem, MenuSettings } from "@/types/interface";

type Dialog = { type: "create" } | { type: "edit" | "delete"; item: MenuItem } | null;

function DishForm({ item, onSubmit, loading }: { item?: MenuItem; onSubmit: (values: MenuItemInput) => void; loading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<MenuItemInput>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: { categorie: item?.categorie ?? "PLAT", nom: item?.nom ?? "", description: item?.description ?? "" },
  });
  const fieldClass = "mt-1.5 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="dish-category" className="text-sm font-medium">Catégorie</label>
        <select id="dish-category" className={`${fieldClass} h-10 cursor-pointer`} {...register("categorie")}>
          {MENU_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dish-name" className="text-sm font-medium">Nom du plat</label>
        <input id="dish-name" placeholder="Ex. Poulet braisé" aria-invalid={!!errors.nom} className={`${fieldClass} h-10`} {...register("nom")} />
        {errors.nom && <p role="alert" className="mt-1 text-xs text-destructive">{errors.nom.message}</p>}
      </div>
      <div>
        <label htmlFor="dish-description" className="text-sm font-medium">Description</label>
        <textarea id="dish-description" placeholder="Quelques mots pour mettre l'eau à la bouche (facultatif)" aria-invalid={!!errors.description} className={`${fieldClass} min-h-20 resize-none py-2`} {...register("description")} />
        {errors.description && <p role="alert" className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" loading={loading}>
          {item ? "Enregistrer" : "Ajouter le plat"}
        </Button>
      </div>
    </form>
  );
}

export function MenuTab() {
  const { data: menu = [], isLoading } = useMenu();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const create = useCreateMenuItem();
  const update = useUpdateMenuItem();
  const remove = useDeleteMenuItem();
  const [dialog, setDialog] = useState<Dialog>(null);

  const menuSettings = settings?.menu;
  const close = () => setDialog(null);
  const onError = (e: Error) => toast.error(e.message);
  const done = (message: string) => () => {
    toast.success(message);
    close();
  };
  const saveSettings = (patch: Partial<MenuSettings>, message: string) => {
    if (!menuSettings) return;
    updateSettings.mutate({ menu: { ...menuSettings, ...patch } }, { onSuccess: () => toast.success(message), onError });
  };

  const shown = menu.filter((m) => m.visible).length;

  return (
    <>
      <Section title="Présentation">
        <SettingRow
          title="Afficher le menu aux invités"
          description="Ajoute la section « Le menu » sur la page d'accueil. Lorsque cette option est désactivée, le menu reste modifiable ici mais les invités ne le voient pas."
        >
          <Switch label="Afficher le menu aux invités" checked={menuSettings?.visible ?? false} disabled={!menuSettings || updateSettings.isPending} onChange={(visible) => saveSettings({ visible }, visible ? "Menu affiché sur l'accueil" : "Menu masqué")} />
        </SettingRow>
        <SettingRow
          title="Service du repas"
          description="Avec traiteur : l'accueil annonce un repas servi à table. Sans traiteur : il annonce un buffet préparé par les familles, en libre-service."
        >
          <Segmented
            label="Service du repas"
            value={menuSettings?.catering ? "TRAITEUR" : "BUFFET"}
            onChange={(value) => saveSettings({ catering: value === "TRAITEUR" }, value === "TRAITEUR" ? "Service traiteur" : "Buffet sans traiteur")}
            options={[{ value: "TRAITEUR", label: "Avec traiteur" }, { value: "BUFFET", label: "Sans traiteur" }]}
          />
        </SettingRow>
        {menuSettings?.catering && (
          <SettingRow title="Nom du traiteur" description="Affiché aux invités sous le titre du menu. Laissez vide pour ne pas le nommer.">
            <TextInput
              // La clé recrée le champ quand la valeur enregistrée change : il repart de la bonne valeur
              key={menuSettings.catererName}
              aria-label="Nom du traiteur"
              defaultValue={menuSettings.catererName}
              placeholder="Ex. Saveurs d'Akwaba"
              onBlur={(e) => e.target.value.trim() !== menuSettings.catererName && saveSettings({ catererName: e.target.value.trim() }, "Traiteur enregistré")}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </SettingRow>
        )}
      </Section>

      <Section
        title="Les plats"
        description={`${menu.length} plat${menu.length > 1 ? "s" : ""} · ${shown} affiché${shown > 1 ? "s" : ""} aux invités`}
        action={
          <Button size="sm" onClick={() => setDialog({ type: "create" })}>
            <Plus />
            Ajouter un plat
          </Button>
        }
      >
        {menu.length === 0 && <EmptyState>{isLoading ? "Chargement…" : "Aucun plat pour l'instant."}</EmptyState>}
        {MENU_CATEGORIES.map((category) => {
          const items = menu.filter((m) => m.categorie === category.value);
          if (items.length === 0) return null;
          return (
            <div key={category.value} className="mt-5">
              <p className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {category.plural}
                <Pill>{items.length}</Pill>
              </p>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-border py-3.5 last:border-0">
                  <div className={item.visible ? "min-w-0 flex-1" : "min-w-0 flex-1 opacity-55"}>
                    <p className="truncate text-[15px] font-medium">{item.nom}</p>
                    {item.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                  <Switch
                    label={`Afficher ${item.nom} aux invités`}
                    checked={item.visible}
                    disabled={update.isPending}
                    onChange={(visible) => update.mutate({ id: item.id, patch: { visible } }, { onError })}
                  />
                  <div className="flex shrink-0 items-center">
                    <IconButton label={`Modifier ${item.nom}`} onClick={() => setDialog({ type: "edit", item })}><Pencil className="size-4" /></IconButton>
                    <IconButton label={`Supprimer ${item.nom}`} tone="danger" onClick={() => setDialog({ type: "delete", item })}><Trash2 className="size-4" /></IconButton>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </Section>

      <Modal open={dialog?.type === "create"} onClose={close} title="Ajouter un plat" size="sm">
        <DishForm loading={create.isPending} onSubmit={(values) => create.mutate(values, { onSuccess: done("Plat ajouté"), onError })} />
      </Modal>

      <Modal open={dialog?.type === "edit"} onClose={close} title="Modifier le plat" size="sm">
        {dialog?.type === "edit" && (
          <DishForm key={dialog.item.id} item={dialog.item} loading={update.isPending} onSubmit={(values) => update.mutate({ id: dialog.item.id, patch: values }, { onSuccess: done("Plat modifié"), onError })} />
        )}
      </Modal>

      <ConfirmAction
        open={dialog?.type === "delete"}
        onClose={close}
        title="Supprimer ce plat ?"
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() => dialog?.type === "delete" && remove.mutate(dialog.item.id, { onSuccess: done("Plat supprimé"), onError })}
      >
        {dialog?.type === "delete" && (
          <>
            <strong className="text-foreground">{dialog.item.nom}</strong> sera retiré du menu. Pour le cacher sans le perdre, utilisez plutôt l&apos;interrupteur.
          </>
        )}
      </ConfirmAction>
    </>
  );
}
