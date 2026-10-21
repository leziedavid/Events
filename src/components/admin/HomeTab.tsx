"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, ImageUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { IconButton, Section, Segmented, SettingRow, Switch, TextInput } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { mapsDirectionsUrl } from "@/config/wedding";
import { useSettings, useUpdateSettings } from "@/hooks/useWedding";
import { imageWidth, resizeImage } from "@/lib/image";
import { ceremonySchema, dressCodeSchema, storySchema, type CeremonyInput, type DressCodeInput, type StoryInput } from "@/lib/schemas";
import type { CeremonyPlace, DressCode, EventSettings, HomeSections, ProgrammePhoto, StoryInfo } from "@/types/interface";

type SectionKey = Exclude<keyof HomeSections, "programmePhoto" | "programmePhotoUrl">;

// Dans l'ordre de la page d'accueil ; la bannière et le bloc « Confirmer ma présence » sont fixes
const SECTIONS: { key: SectionKey | "menu"; title: string; description: string }[] = [
  { key: "programme", title: "Programme de la journée", description: "Les étapes du jour (onglet « Programme »), sur la photo de fond choisie ci-dessous." },
  { key: "dressCode", title: "Dress code", description: "La consigne de tenue et les couleurs du mariage (modifiables plus bas)." },
  { key: "menu", title: "Menu du repas", description: "Les plats se gèrent dans l'onglet « Menu du repas »." },
  { key: "gallery", title: "Galerie photo", description: "Les photos des mariés en mosaïque." },
  { key: "venue", title: "Les lieux", description: "Bénédiction nuptiale et réception, avec carte et itinéraire." },
  { key: "guestbook", title: "Livre d'or", description: "Le formulaire et les derniers messages des invités." },
  { key: "story", title: "Notre histoire", description: "Le mot des mariés et leurs parents (modifiables plus bas), en fin de page." },
];

const fieldClass =
  "w-full rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

function DressCodeForm({ value, onSave, saving }: { value: DressCode; onSave: (v: DressCodeInput) => void; saving: boolean }) {
  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<DressCodeInput>({
    resolver: zodResolver(dressCodeSchema),
    values: value,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "colors" });
  const colors = useWatch({ control, name: "colors" });

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>
      <SettingRow title="Titre" description="Affiché en grand au-dessus des couleurs.">
        <div className="w-full sm:w-72">
          <TextInput aria-label="Titre du dress code" aria-invalid={!!errors.title} {...register("title")} />
          <FieldError message={errors.title?.message} />
        </div>
      </SettingRow>
      <div className="border-b border-border py-5">
        <label htmlFor="dress-description" className="text-[15px] font-medium">
          Consigne
        </label>
        <p className="mt-1 text-sm text-muted-foreground">Le type de tenue attendu (soirée, traditionnelle, pagne…).</p>
        <textarea id="dress-description" aria-invalid={!!errors.description} className={`${fieldClass} mt-2 min-h-20 resize-none py-2`} {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="border-b border-border py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium">Couleurs</p>
            <p className="mt-1 text-sm text-muted-foreground">Jusqu&apos;à 8 couleurs, présentées en pastilles aux invités.</p>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={fields.length >= 8} onClick={() => append({ name: "", hex: "#C59D5F" })}>
            <Plus />
            Ajouter une couleur
          </Button>
        </div>
        <ul className="mt-4 space-y-2">
          {fields.map((field, i) => (
            <li key={field.id} className="flex items-center gap-2">
              {/* Le sélecteur natif ouvre la palette du système ; le code s'affiche à côté */}
              <input
                type="color"
                aria-label={`Couleur ${i + 1}`}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
                {...register(`colors.${i}.hex`)}
              />
              <span className="w-20 shrink-0 font-mono text-xs uppercase text-muted-foreground">{colors?.[i]?.hex}</span>
              <div className="min-w-0 flex-1">
                <input placeholder="Nom de la couleur" aria-label={`Nom de la couleur ${i + 1}`} aria-invalid={!!errors.colors?.[i]?.name} className={`${fieldClass} h-9`} {...register(`colors.${i}.name`)} />
                <FieldError message={errors.colors?.[i]?.name?.message} />
              </div>
              <IconButton label={`Retirer la couleur ${i + 1}`} tone="danger" onClick={() => remove(i)}>
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
          {fields.length === 0 && <li className="py-3 text-sm text-muted-foreground">Aucune couleur : seule la consigne sera affichée.</li>}
        </ul>
      </div>

      <SettingRow title="Recommandation" description="Une précision facultative, par exemple une couleur à éviter.">
        <div className="w-full sm:w-72">
          <TextInput aria-label="Recommandation" placeholder="Ex. Merci d'éviter le blanc" aria-invalid={!!errors.note} {...register("note")} />
          <FieldError message={errors.note?.message} />
        </div>
      </SettingRow>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" size="sm" variant="ghost" disabled={!isDirty || saving} onClick={() => reset()}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={!isDirty} loading={saving}>
          Enregistrer le dress code
        </Button>
      </div>
    </form>
  );
}

function StoryForm({ value, onSave, saving }: { value: StoryInfo; onSave: (v: StoryInput) => void; saving: boolean }) {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<StoryInput>({
    resolver: zodResolver(storySchema),
    values: value,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>
      <div className="border-b border-border py-5">
        <label htmlFor="story-text" className="text-[15px] font-medium">
          Le mot des mariés
        </label>
        <p className="mt-1 text-sm text-muted-foreground">Affiché en citation, au-dessus des prénoms.</p>
        <textarea id="story-text" aria-invalid={!!errors.text} className={`${fieldClass} mt-2 min-h-28 resize-none py-2`} {...register("text")} />
        <FieldError message={errors.text?.message} />
      </div>
      <SettingRow title="Parents du marié" description="Ex. « M. et Mme Kouadio ». Laissez vide pour ne rien afficher.">
        <div className="w-full sm:w-72">
          <TextInput aria-label="Parents du marié" aria-invalid={!!errors.groomParents} {...register("groomParents")} />
          <FieldError message={errors.groomParents?.message} />
        </div>
      </SettingRow>
      <SettingRow title="Parents de la mariée">
        <div className="w-full sm:w-72">
          <TextInput aria-label="Parents de la mariée" aria-invalid={!!errors.brideParents} {...register("brideParents")} />
          <FieldError message={errors.brideParents?.message} />
        </div>
      </SettingRow>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" size="sm" variant="ghost" disabled={!isDirty || saving} onClick={() => reset()}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={!isDirty} loading={saving}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function CeremonyForm({ value, onSave, saving }: { value: CeremonyPlace; onSave: (v: CeremonyInput) => void; saving: boolean }) {
  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<CeremonyInput>({
    resolver: zodResolver(ceremonySchema),
    values: value,
  });
  const address = useWatch({ control, name: "address" });

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>
      <SettingRow title="Nom du lieu" description="Église, paroisse ou temple de la bénédiction nuptiale.">
        <div className="w-full sm:w-72">
          <TextInput aria-label="Nom du lieu de la bénédiction" aria-invalid={!!errors.name} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
      </SettingRow>
      <SettingRow
        title="Adresse"
        description={
          <>
            Sert à centrer la carte et à calculer l&apos;itinéraire.{" "}
            {address && (
              <a href={mapsDirectionsUrl(address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                Vérifier sur Google Maps <ExternalLink className="size-3" />
              </a>
            )}
          </>
        }
      >
        <div className="w-full sm:w-72">
          <TextInput aria-label="Adresse de la bénédiction" aria-invalid={!!errors.address} {...register("address")} />
          <FieldError message={errors.address?.message} />
        </div>
      </SettingRow>
      <SettingRow
        title="Heure"
        description={
          <>
            L&apos;heure affichée est celle de l&apos;étape du programme rattachée à la bénédiction.{" "}
            <Link href="/admin?tab=programme" className="font-medium text-primary underline-offset-4 hover:underline">
              Modifier le programme
            </Link>
          </>
        }
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" size="sm" variant="ghost" disabled={!isDirty || saving} onClick={() => reset()}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={!isDirty} loading={saving}>
          Enregistrer le lieu
        </Button>
      </div>
    </form>
  );
}

/** Onglet « Page d'accueil » : sections affichées, photo du programme, dress code, lieu de la bénédiction */
export function HomeTab() {
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!settings) return <p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>;

  const save = (patch: Partial<EventSettings>, message: string) =>
    update.mutate(patch, { onSuccess: () => toast.success(message), onError: (e) => toast.error(e.message) });

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de renvoyer le même fichier après une erreur
    if (!file) return;
    setUploading(true);
    try {
      const programmePhotoUrl = await resizeImage(file);
      if ((await imageWidth(programmePhotoUrl)) < 1200) {
        toast.warning("Photo petite : elle risque d'être floue en plein écran. Une photo d'au moins 1600 px de large est conseillée.");
      }
      save({ home: { ...settings.home, programmePhotoUrl, programmePhoto: "personnalisee" } }, "Photo du programme enregistrée");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const isVisible = (key: SectionKey | "menu") => (key === "menu" ? settings.menu.visible : settings.home[key]);
  const toggle = (key: SectionKey | "menu", visible: boolean, title: string) => {
    const message = `${title} : ${visible ? "affiché" : "masqué"} sur l'accueil`;
    if (key === "menu") save({ menu: { ...settings.menu, visible } }, message);
    else save({ home: { ...settings.home, [key]: visible } }, message);
  };

  return (
    <>
      <Section
        title="Sections affichées"
        description="Une section masquée disparaît de l'accueil et de la barre de navigation. Son contenu est conservé : réactivez-la à tout moment."
        action={
          <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
            Voir l&apos;accueil <ExternalLink className="size-3.5" />
          </Link>
        }
      >
        {SECTIONS.map((section) => (
          <SettingRow key={section.key} title={section.title} description={section.description}>
            <Switch label={section.title} checked={isVisible(section.key)} disabled={update.isPending} onChange={(visible) => toggle(section.key, visible, section.title)} />
          </SettingRow>
        ))}
        <SettingRow
          title="Photo de fond du programme"
          description="Les photos fournies (590 px) restent à leur taille réelle au centre de l'écran pour rester nettes. Votre propre photo, si elle est assez grande, couvre toute la section."
        >
          <Segmented<ProgrammePhoto>
            label="Photo de fond du programme"
            value={settings.home.programmePhoto}
            onChange={(programmePhoto) => {
              // « Ma photo » sans photo enregistrée : on ouvre directement le choix du fichier
              if (programmePhoto === "personnalisee" && !settings.home.programmePhotoUrl) return fileRef.current?.click();
              save({ home: { ...settings.home, programmePhoto } }, "Photo du programme enregistrée");
            }}
            options={[
              { value: "traditionnel", label: "Tenue traditionnelle" },
              { value: "portrait", label: "Portrait" },
              { value: "personnalisee", label: "Ma photo" },
              { value: "aucune", label: "Aucune" },
            ]}
          />
        </SettingRow>
        <SettingRow
          title="Ma photo"
          description="Une photo en paysage d'au moins 1600 px de large pour un rendu net en plein écran. Elle est réduite à 1920 px avant d'être enregistrée."
        >
          <div className="flex items-center gap-3">
            {settings.home.programmePhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une data URL
              <img src={settings.home.programmePhotoUrl} alt="Photo du programme" className="h-12 w-20 rounded-md border border-border object-cover" />
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} aria-label="Choisir une photo pour le programme" />
            <Button type="button" size="sm" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
              {!uploading && <ImageUp />}
              {settings.home.programmePhotoUrl ? "Remplacer" : "Envoyer une photo"}
            </Button>
            {settings.home.programmePhotoUrl && (
              <IconButton
                label="Retirer ma photo"
                tone="danger"
                onClick={() =>
                  save(
                    {
                      home: {
                        ...settings.home,
                        programmePhotoUrl: "",
                        programmePhoto: settings.home.programmePhoto === "personnalisee" ? "traditionnel" : settings.home.programmePhoto,
                      },
                    },
                    "Photo retirée",
                  )
                }
              >
                <Trash2 className="size-4" />
              </IconButton>
            )}
          </div>
        </SettingRow>
      </Section>

      <Section title="Dress code">
        <DressCodeForm value={settings.dressCode} saving={update.isPending} onSave={(dressCode) => save({ dressCode }, "Dress code enregistré")} />
      </Section>

      <Section
        title="Lieu de la bénédiction nuptiale"
        description="Le lieu de la réception se règle dans l'onglet « Événement » (il figure sur les cartes d'invitation)."
      >
        <CeremonyForm value={settings.ceremony} saving={update.isPending} onSave={(ceremony) => save({ ceremony }, "Lieu de la bénédiction enregistré")} />
      </Section>

      <Section title="Notre histoire" description="Section placée en fin de page ; affichez-la avec l'interrupteur « Notre histoire » ci-dessus.">
        <StoryForm value={settings.story} saving={update.isPending} onSave={(story) => save({ story }, "« Notre histoire » enregistrée")} />
      </Section>
    </>
  );
}
