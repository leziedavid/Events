// Préparation des photos envoyées depuis la gestion. En démonstration elles sont stockées dans
// le navigateur (quelques Mo au total) : on les réduit avant de les enregistrer. Avec le
// backend, l'original partira chez l'hébergeur d'images (Cloudinary / UploadThing).

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Redimensionne une image (plus grand côté ≤ `maxSize`) et la renvoie en JPEG, sous forme de data URL */
export async function resizeImage(file: File, maxSize = 1920, quality = 0.82): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Format non pris en charge : utilisez une photo JPEG, PNG ou WebP.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de préparer la photo dans ce navigateur.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

/** Largeur réelle d'une image, pour prévenir si elle sera floue en plein écran */
export function imageWidth(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth);
    img.onerror = () => reject(new Error("Image illisible."));
    img.src = src;
  });
}
