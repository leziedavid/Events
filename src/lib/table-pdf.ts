// PDF d'une table, pour l'impression par les responsables de salle : page 1 = le nom de la table
// en très grand (chevalet à poser sur la table), page 2 = la liste des invités. Deux feuilles
// séparées dans le même fichier : elles se détachent l'une de l'autre après impression.

import { displayName, formatDateTime, personnes, tableLabel } from "@/lib/utils";
import type { TableSummary } from "@/types/interface";

/** Nom de fichier sans accents ni espaces (« table-camelia.pdf ») */
const fileName = (name: string) =>
  `table-${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sans-nom"}.pdf`;

export async function downloadTablePdf(table: TableSummary, title: string): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const terracotta: [number, number, number] = [184, 92, 56];
  const brown: [number, number, number] = [46, 31, 24];

  // ─── Page 1 : le nom de la table, en paysage, aussi grand que la feuille le permet ───
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const name = table.name.trim() || `Table ${table.numero}`;

  doc.setDrawColor(...terracotta);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageW - 20, pageH - 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...terracotta);
  doc.setFontSize(16);
  doc.text(title.toUpperCase(), pageW / 2, 32, { align: "center", charSpace: 1.5 });

  // Taille du nom : la plus grande qui tient dans la largeur utile (et pas plus de 200 pt)
  doc.setFont("helvetica", "bold");
  let size = 200;
  doc.setFontSize(size);
  while (size > 40 && doc.getTextWidth(name) > pageW - 50) {
    size -= 4;
    doc.setFontSize(size);
  }
  doc.setTextColor(...brown);
  doc.text(name, pageW / 2, pageH / 2 + size * 0.12, { align: "center", baseline: "middle" });

  if (!/^table\b/i.test(name)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.setTextColor(...terracotta);
    doc.text(table.isVip ? "TABLE RÉSERVÉE" : "TABLE", pageW / 2, pageH - 30, { align: "center", charSpace: 2 });
  }

  // ─── Page 2 : la liste des invités de la table ───
  doc.addPage("a4", "portrait");
  const portraitW = doc.internal.pageSize.getWidth();
  const total = table.guests.reduce((s, g) => s + g.nombrePersonnes, 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...terracotta);
  doc.text(title, 14, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...brown);
  doc.text(tableLabel(table.numero, [table]), 14, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(110);
  doc.text(
    `${table.guests.length} invitation${table.guests.length > 1 ? "s" : ""} - ${personnes(total)} sur ${table.seats} places - édité le ${formatDateTime(new Date().toISOString())}`,
    14,
    38,
  );

  if (table.guests.length === 0) {
    doc.setFontSize(13);
    doc.text("Aucun invité n'est encore placé à cette table.", 14, 54);
  } else {
    autoTable(doc, {
      startY: 46,
      head: [["", "Invité", "Personnes", "Présent"]],
      body: table.guests.map((g, i) => [String(i + 1), displayName(g), String(g.nombrePersonnes), ""]),
      styles: { fontSize: 13, cellPadding: 4, textColor: brown },
      headStyles: { fillColor: terracotta, textColor: [255, 250, 243] },
      alternateRowStyles: { fillColor: [248, 240, 229] },
      columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 38, halign: "center" }, 3: { cellWidth: 28 } },
      margin: { left: 14, right: 14 },
      tableWidth: portraitW - 28,
    });
  }

  doc.save(fileName(name));
}
