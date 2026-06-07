/**
 * Ingere os documentos internos (data/corporate/*) e gera o índice de conhecimento
 * consumido em runtime pelo Cérebro Corporativo:  public/corporate-knowledge.json
 *
 * Pipeline:  PDF (pdf-parse) / Excel (SheetJS)  →  RecursiveCharacterTextSplitter
 * (LangChain)  →  chunks { id, source, page, text }.
 *
 * Uso: node data/ingest_corporate.mjs   (rode generate_corporate_docs.mjs antes)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import * as XLSXNS from "xlsx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const XLSX = XLSXNS.default ?? XLSXNS;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC_DIR = path.join(ROOT, "data", "corporate");

const SOURCE_LABELS = {
  "politica-comercial.pdf": "Política Comercial",
  "catalogo-produtos.pdf": "Catálogo de Produtos",
  "faq-interno.pdf": "FAQ Interno",
  "tabela-precos.xlsx": "Tabela de Preços",
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 700,
  chunkOverlap: 120,
  separators: ["\n\n", "\n", ". ", " ", ""],
});

const chunks = [];
let seq = 0;
function pushChunks(source, page, text, pieces) {
  for (const piece of pieces) {
    const clean = piece.replace(/[ \t]+/g, " ").trim();
    if (clean.length < 20) continue;
    chunks.push({ id: `c${++seq}`, source, page, text: clean });
  }
}

// ── PDFs ──────────────────────────────────────────────────────────────────────
const pdfFiles = fs.readdirSync(DOC_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
for (const file of pdfFiles) {
  const label = SOURCE_LABELS[file] ?? file;
  const buf = fs.readFileSync(path.join(DOC_DIR, file));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const res = await parser.getText();
  await parser.destroy?.();
  const pages = res.pages && res.pages.length ? res.pages : [{ text: res.text, num: 1 }];
  for (const pg of pages) {
    const pieces = await splitter.splitText(pg.text || "");
    pushChunks(label, pg.num ?? 1, pg.text, pieces);
  }
}

// ── Excel ─────────────────────────────────────────────────────────────────────
const xlsxFiles = fs.readdirSync(DOC_DIR).filter((f) => f.toLowerCase().endsWith(".xlsx"));
for (const file of xlsxFiles) {
  const label = SOURCE_LABELS[file] ?? file;
  const wb = XLSX.readFile(path.join(DOC_DIR, file));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  const brl = (v) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  // Cada linha vira uma frase pesquisável; agrupa de ~6 em ~6 num chunk.
  const sentences = rows.map(
    (r) =>
      `${r.product_id} — ${r.produto} (${r.categoria}): preço de varejo ${brl(r.preco_varejo_brl)}; ` +
      `preço de distribuidor ${brl(r.preco_distribuidor_brl)}; ${r.unidades_por_caixa} unidades por caixa; ` +
      `pedido mínimo ${r.moq_caixas} caixas.`
  );
  const header = "Tabela de Preços YMED 2025 (varejo e distribuidor por SKU).";
  for (let i = 0; i < sentences.length; i += 6) {
    const text = header + "\n" + sentences.slice(i, i + 6).join("\n");
    pushChunks(label, 1, text, [text]);
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  sources: [...new Set(chunks.map((c) => c.source))],
  chunkCount: chunks.length,
  chunks,
};
fs.writeFileSync(path.join(ROOT, "public", "corporate-knowledge.json"), JSON.stringify(out, null, 2), "utf-8");

console.log(`corporate-knowledge.json gerado: ${chunks.length} chunks de ${out.sources.length} fontes.`);
for (const s of out.sources) {
  console.log(`  ${s}: ${chunks.filter((c) => c.source === s).length} chunks`);
}
