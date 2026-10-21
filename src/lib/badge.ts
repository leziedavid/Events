// Export de la carte d'invitation en image (html-to-image, chargé à la demande).

async function badgeToPng(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  // pixelRatio 3 : la carte reste nette une fois imprimée, quelle que soit sa taille à l'écran
  return toPng(node, { pixelRatio: 3, cacheBust: true });
}

export async function downloadBadge(node: HTMLElement, filename: string): Promise<void> {
  const link = document.createElement("a");
  link.href = await badgeToPng(node);
  link.download = filename;
  link.click();
}

export async function badgeFile(node: HTMLElement, filename: string): Promise<File> {
  const blob = await (await fetch(await badgeToPng(node))).blob();
  return new File([blob], filename, { type: "image/png" });
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
