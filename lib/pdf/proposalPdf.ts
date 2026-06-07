import { jsPDF } from "jspdf";
import { Proposal } from "@/types";

/**
 * Renderiza uma proposta comercial em PDF no CLIENTE (jsPDF) e dispara o download.
 * Feito no navegador para evitar os problemas de geração de PDF server-side no
 * App Router (e qualquer dependência de binário/serverless).
 */
export function downloadProposalPdf(p: Proposal) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = W - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > H - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const paragraph = (
    text: string,
    { size = 11, color = [55, 65, 81] as number[], bold = false, gap = 6, indent = 0 } = {}
  ) => {
    if (!text) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxW - indent) as string[];
    for (const line of lines) {
      ensure(size + gap);
      doc.text(line, margin + indent, y);
      y += size + gap;
    }
  };

  // Faixa verde + cabeçalho
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, W, 10, "F");
  y = margin;
  paragraph("YMED", { size: 22, color: [22, 163, 74], bold: true, gap: 2 });
  paragraph("Indústria de Higiene e Limpeza · Proposta Comercial", { size: 10, color: [107, 114, 128], gap: 12 });

  paragraph(p.title, { size: 16, color: [17, 24, 39], bold: true, gap: 4 });
  paragraph(`Cliente: ${p.client}    ·    Data: ${p.date}`, { size: 10, color: [107, 114, 128], gap: 14 });

  paragraph(p.intro, { size: 11, gap: 6 });
  y += 6;

  for (const s of p.sections) {
    paragraph(s.heading, { size: 12.5, color: [17, 24, 39], bold: true, gap: 5 });
    paragraph(s.body, { size: 11, gap: 6 });
    y += 4;
  }

  if (p.pricing.length) {
    paragraph("Tabela de itens", { size: 12.5, color: [17, 24, 39], bold: true, gap: 6 });
    for (const item of p.pricing) {
      const left = item.detail ? `${item.item} — ${item.detail}` : item.item;
      ensure(16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(55, 65, 81);
      const leftLines = doc.splitTextToSize(left, maxW - 110) as string[];
      doc.text(leftLines, margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text(item.price, W - margin, y, { align: "right" });
      y += Math.max(leftLines.length * 13, 16);
    }
    y += 6;
  }

  paragraph(p.validity, { size: 10.5, color: [107, 114, 128], bold: true, gap: 6 });
  y += 6;
  paragraph(p.closing, { size: 11, gap: 6 });

  if (p.sources?.length) {
    y += 8;
    paragraph(`Baseado em documentos internos: ${p.sources.join(", ")}.`, {
      size: 8.5,
      color: [156, 163, 175],
      gap: 4,
    });
  }

  const safeClient = p.client.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "Cliente";
  doc.save(`Proposta_YMED_${safeClient}.pdf`);
}
