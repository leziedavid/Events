// Exports de la liste des invités. Les bibliothèques sont chargées à la demande : elles
// sont lourdes et ne servent qu'à l'administration.

import { categoryMeta } from "@/config/categories";
import { weddingTitle } from "@/config/wedding";
import { displayName, formatDateTime } from "@/lib/utils";
import type { Rsvp } from "@/types/interface";

const HEADERS = ["Invité", "Téléphone", "Catégorie", "Personnes", "Table", "Table choisie", "Code", "Statut", "Inscrit le"];

function toRow(g: Rsvp): (string | number)[] {
  return [
    displayName(g),
    g.telephone,
    categoryMeta(g.categorie).label,
    g.nombrePersonnes,
    g.isRevoked ? "-" : g.tableNumero,
    g.tableChoisie ? "Oui" : "Non",
    g.verificationCode,
    g.isRevoked ? "Révoquée" : g.isVerified && g.verifiedAt ? `Arrivé (${formatDateTime(g.verifiedAt)})` : "En attente",
    formatDateTime(g.createdAt),
  ];
}

export async function exportGuestsExcel(guests: Rsvp[]): Promise<void> {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...guests.map(toRow)]);
  sheet["!cols"] = [28, 18, 16, 11, 8, 13, 14, 24, 18].map((wch) => ({ wch }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Invités");
  XLSX.writeFile(book, "invites-mariage.xlsx");
}

export async function exportGuestsPdf(guests: Rsvp[], title: string = weddingTitle()): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape" });
  const total = guests.reduce((s, g) => s + g.nombrePersonnes, 0);

  doc.setFontSize(18);
  doc.text(`${title} - Liste des invités`, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${guests.length} invitations - ${total} personnes - édité le ${formatDateTime(new Date().toISOString())}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [HEADERS],
    body: guests.map(toRow),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 39, 74], textColor: [245, 239, 227] },
    alternateRowStyles: { fillColor: [250, 245, 235] },
  });
  doc.save("invites-mariage.pdf");
}
