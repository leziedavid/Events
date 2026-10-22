// Export de la carte d'invitation en image (html-to-image, chargé à la demande).
//
// iPhone / iPad (Safari, et Chrome iOS qui utilise le même moteur) :
// - un lien `download` n'enregistre jamais une image dans Photos : il faut passer par la feuille
//   de partage (navigator.share avec le fichier), qui propose « Enregistrer l'image » ;
// - cette feuille ne s'ouvre que si l'appel suit IMMÉDIATEMENT le toucher de l'invité : l'image
//   doit donc être prête avant (voir prepareBadgeFile, appelé dès l'affichage de la carte) ;
// - Safari rate souvent la première capture (photo ou polices manquantes) : on attend que tout
//   soit chargé et on fait une capture « à blanc » avant la vraie.

/** iPhone, iPad (y compris iPadOS qui se présente comme un Mac) et iPod */
export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Attend les polices et le décodage des images de la carte, 4 s au plus : une image en échec ne
 * doit jamais bloquer l'export (la carte est alors capturée telle qu'affichée).
 */
async function waitForAssets(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img")).map((img) =>
    img.complete
      ? img.decode().catch(() => undefined)
      : new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
  );
  await Promise.race([
    Promise.all([document.fonts?.ready, ...images]),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);
}

/**
 * Polices de la carte, intégrées une seule fois par page. Sans ce cache, chaque capture
 * re-téléchargeait toutes les polices du site (des centaines de requêtes) : trop lourd pour un
 * iPhone, qui abandonnait la capture.
 */
let fontEmbedCSS: Promise<string> | null = null;

async function badgeToPng(node: HTMLElement): Promise<string> {
  const { toPng, getFontEmbedCSS } = await import("html-to-image");
  await waitForAssets(node);
  // Sans `preferredFontFormat` : ce filtre écartait la police manuscrite (Great Vibes) des mariés
  fontEmbedCSS ??= getFontEmbedCSS(node).catch(() => {
    fontEmbedCSS = null;
    return "";
  });
  // pixelRatio 3 : la carte reste nette une fois imprimée, quelle que soit sa taille à l'écran.
  // Pas de cacheBust : les images et polices viennent du cache du navigateur.
  const options = { pixelRatio: 3, fontEmbedCSS: await fontEmbedCSS };
  // Capture à blanc : à la première, le navigateur n'a pas encore appliqué les polices intégrées
  // (le nom des mariés sortait sans sa police manuscrite) ; Safari oublie aussi parfois la photo
  await toPng(node, options).catch(() => undefined);
  return toPng(node, options);
}

/**
 * Image de la carte. Une capture faite avant que la carte soit affichée (taille nulle) donne une
 * image vide : elle est refusée, pour ne jamais enregistrer ni partager une carte blanche.
 */
export async function badgeFile(node: HTMLElement, filename: string): Promise<File> {
  if (!node.offsetWidth || !node.offsetHeight) throw new Error("Carte pas encore affichée");
  const blob = await (await fetch(await badgeToPng(node))).blob();
  if (blob.size < 10_000) throw new Error("Capture de la carte incomplète");
  return new File([blob], filename, { type: "image/png" });
}

/** Le navigateur sait partager (donc enregistrer dans Photos sur iPhone) ce fichier */
export function canShareFile(file: File): boolean {
  return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
}

/** Téléchargement classique (ordinateur, Android) d'un fichier déjà généré */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadBadge(node: HTMLElement, filename: string): Promise<void> {
  downloadFile(await badgeFile(node, filename));
}

/** Ouvre l'image seule dans une fenêtre et lance l'impression (carte d'invitation, affiche QR) */
export async function printBadge(node: HTMLElement, title = "Carte d'invitation"): Promise<void> {
  const dataUrl = await badgeToPng(node);
  const win = window.open("", "_blank");
  if (!win) throw new Error("Autorisez les fenêtres pop-up pour imprimer la carte.");
  win.document.title = title;
  win.document.body.style.margin = "0";
  const img = win.document.createElement("img");
  img.style.width = "100%";
  img.onload = () => {
    win.focus();
    win.print();
  };
  img.src = dataUrl;
  win.document.body.appendChild(img);
}

export function badgeFilename(code: string): string {
  return `invitation-${code}.png`;
}
