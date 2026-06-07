/**
 * Gera os documentos internos da YMED para a demo do "Cérebro Corporativo":
 *   data/corporate/politica-comercial.pdf
 *   data/corporate/catalogo-produtos.pdf
 *   data/corporate/faq-interno.pdf
 *   data/corporate/tabela-precos.xlsx
 *
 * São arquivos reais (PDF via pdf-lib, Excel via SheetJS) — depois ingeridos por
 * data/ingest_corporate.mjs para provar, na demo, que o assistente lê os arquivos.
 *
 * Uso: node data/generate_corporate_docs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "corporate");
fs.mkdirSync(OUT_DIR, { recursive: true });

const GREEN = rgb(0.086, 0.639, 0.29);
const DARK = rgb(0.07, 0.09, 0.15);
const GRAY = rgb(0.35, 0.4, 0.45);

// ── Helper: monta um PDF a partir de blocos com quebra de linha + paginação ────
async function buildPdf(title, subtitle, blocks) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const margin = 56;
  const maxW = W - margin * 2;

  let page = pdf.addPage([W, H]);
  let y = H - margin;

  function newPage() {
    page = pdf.addPage([W, H]);
    y = H - margin;
  }
  function ensure(space) {
    if (y - space < margin) newPage();
  }
  function wrap(text, f, size) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function draw(text, { f = font, size = 11, color = DARK, gap = 4, indent = 0 } = {}) {
    for (const line of wrap(text, f, size)) {
      ensure(size + gap);
      page.drawText(line, { x: margin + indent, y: y - size, size, font: f, color });
      y -= size + gap;
    }
  }

  // Cabeçalho
  page.drawRectangle({ x: 0, y: H - 18, width: W, height: 18, color: GREEN });
  draw("YMED — Documento Interno", { f: bold, size: 9, color: GRAY, gap: 10 });
  draw(title, { f: bold, size: 20, color: GREEN, gap: 4 });
  if (subtitle) draw(subtitle, { f: font, size: 11, color: GRAY, gap: 14 });

  for (const b of blocks) {
    if (b.h) {
      ensure(26);
      y -= 8;
      draw(b.h, { f: bold, size: 13, color: DARK, gap: 6 });
    }
    if (b.p) draw(b.p, { size: 11, gap: 5 });
    if (b.bullets) for (const item of b.bullets) draw(`•  ${item}`, { size: 11, gap: 4, indent: 6 });
  }

  return pdf.save();
}

// ── 1. Política Comercial ─────────────────────────────────────────────────────
const politica = await buildPdf(
  "Política Comercial",
  "Vigência 2025 · Canal B2B (distribuidores, atacado e redes de varejo)",
  [
    { h: "1. Tabela de descontos por volume", p: "Os descontos abaixo são aplicados sobre o preço de tabela (varejo sugerido) e são cumulativos com a condição de pagamento à vista." },
    { bullets: [
      "Até 99 caixas: sem desconto (preço de tabela).",
      "De 100 a 299 caixas: 8% de desconto.",
      "De 300 a 499 caixas: 12% de desconto.",
      "De 500 a 999 caixas: 18% de desconto.",
      "Acima de 1000 caixas: 25% de desconto (preço de distribuidor master).",
    ] },
    { h: "2. Condições de pagamento", p: "Pagamento à vista (PIX ou boleto) garante 3% adicionais de desconto. Prazos disponíveis: 30, 45 e 60 dias para clientes com cadastro aprovado e limite de crédito definido pelo financeiro." },
    { h: "3. Pedido mínimo (MOQ)", p: "O pedido mínimo para faturamento é de 50 caixas por pedido, com no mínimo 10 caixas por SKU. Cada caixa-padrão contém 12 unidades para sabonetes e 6 unidades para shampoos e detergentes." },
    { h: "4. Prazos de entrega", bullets: [
      "Sudeste: 3 a 5 dias úteis.",
      "Sul e Centro-Oeste: 5 a 8 dias úteis.",
      "Nordeste: 7 a 10 dias úteis.",
      "Norte: 10 a 15 dias úteis.",
    ] },
    { p: "Frete CIF (por conta da YMED) para pedidos acima de 300 caixas; abaixo disso o frete é FOB (por conta do cliente)." },
    { h: "5. Margem sugerida ao distribuidor", p: "A YMED recomenda margem de revenda entre 28% e 35% sobre o preço de distribuidor. O preço de distribuidor equivale, em média, a 82% do preço de tabela de varejo." },
    { h: "6. Política de trocas e devoluções", p: "Trocas por avaria de transporte são aceitas em até 7 dias corridos após o recebimento, mediante registro fotográfico. Produtos com defeito de fabricação têm garantia de 90 dias. Não há devolução por excesso de estoque do cliente." },
    { h: "7. Lançamentos e exclusividade", p: "Distribuidores master (acima de 1000 caixas/mês) têm acesso a pré-lançamentos com 30 dias de antecedência e podem solicitar exclusividade regional mediante meta trimestral acordada em contrato." },
  ]
);
fs.writeFileSync(path.join(OUT_DIR, "politica-comercial.pdf"), politica);

// ── 2. Catálogo de Produtos (visão geral) ─────────────────────────────────────
const catalogo = await buildPdf(
  "Catálogo de Produtos — Visão Geral",
  "Linha 2025 · Higiene e limpeza",
  [
    { h: "Sobre a YMED", p: "A YMED é uma indústria brasileira de produtos de higiene e limpeza com um portfólio de 180 SKUs distribuídos em três categorias: sabonetes, shampoos e detergentes. Todos os produtos são desenvolvidos com foco em pH balanceado, biodegradabilidade e essências naturais." },
    { h: "Sabonetes", p: "São 70 SKUs, com gramaturas de 80g a 200g e pH entre 5,0 e 6,2. Subcategorias: hidratante, suave, nutritivo, antibacteriano, neutro, premium, sport e linha bebê. Essências de destaque: Lavanda, Rosa, Coco e Camomila. A linha premium (200g) é a de maior ticket médio." },
    { h: "Shampoos", p: "São 60 SKUs, de 200ml a 400ml, com pH entre 4,7 e 5,8. Subcategorias: hidratante, anticaspa, nutritivo, sem sal, suave, brilho, volume, reconstrução, premium e bebê. A linha 'sem sal' e a 'anticaspa' têm maior valor agregado." },
    { h: "Detergentes", p: "São 50 SKUs, de 500ml a 1000ml, com pH entre 7,0 e 8,2. Subcategorias: neutro, desengordurante, biodegradável, concentrado, antibacteriano, suave, premium e bebê. O detergente neutro 500ml é o maior volume de vendas da empresa." },
    { h: "Diferenciais", bullets: [
      "Fórmulas dermatologicamente testadas.",
      "Detergentes com versões biodegradáveis e concentradas.",
      "Linha bebê com pH neutro (5,0) e sem perfume.",
      "Essências exclusivas: Erva-Doce e Aloe Vera.",
    ] },
    { h: "Posicionamento de preço", p: "O ticket médio do catálogo é de aproximadamente R$ 10,84 por unidade no varejo. Sabonetes premium e shampoos sem sal ocupam a faixa superior; detergentes neutros e sabonetes neutros ocupam a faixa de entrada, com maior giro." },
  ]
);
fs.writeFileSync(path.join(OUT_DIR, "catalogo-produtos.pdf"), catalogo);

// ── 3. FAQ Interno ────────────────────────────────────────────────────────────
const faq = await buildPdf(
  "FAQ Interno — Equipe Comercial",
  "Perguntas frequentes de vendas e pós-venda",
  [
    { h: "Quais certificações os produtos YMED possuem?", p: "Todos os produtos têm registro na ANVISA, certificação dermatológica e os detergentes possuem selo de biodegradabilidade. A linha bebê é hipoalergênica e testada oftalmologicamente." },
    { h: "Qual o prazo de validade dos produtos?", p: "Sabonetes têm validade de 36 meses; shampoos e detergentes, 24 meses a partir da data de fabricação impressa no lote." },
    { h: "Como funciona o onboarding de um novo distribuidor?", p: "O cadastro é aprovado em até 3 dias úteis mediante CNPJ ativo e inscrição estadual. O primeiro pedido tem MOQ reduzido de 30 caixas e acompanhamento de um consultor comercial dedicado nos primeiros 90 dias." },
    { h: "Existe verba de marketing cooperado?", p: "Sim. Distribuidores acima de 500 caixas/mês têm acesso a verba cooperada de até 2% do faturamento trimestral para ações locais (ponto de venda, encartes e digital), mediante aprovação prévia do plano." },
    { h: "Qual a política para amostras?", p: "Amostras são liberadas em kits de até 10 unidades por novo cliente, sem custo, uma vez por trimestre. Kits adicionais são faturados ao preço de custo." },
    { h: "Como solicitar exclusividade regional?", p: "A exclusividade é concedida a distribuidores master com meta trimestral acordada em contrato e cobertura mínima de 80% dos municípios da região alvo." },
    { h: "Qual o contato do SAC e suporte ao cliente?", p: "O SAC YMED atende de segunda a sexta, das 8h às 18h, pelo e-mail sac@ymed.com.br e telefone 0800-YMED. Reclamações de qualidade são tratadas pela área de Garantia em até 5 dias úteis." },
  ]
);
fs.writeFileSync(path.join(OUT_DIR, "faq-interno.pdf"), faq);

// ── 4. Tabela de Preços (Excel) — derivada do catálogo real ───────────────────
function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/);
  const header = rows[0].split(",");
  return rows.slice(1).map((line) => {
    const cells = line.split(",");
    const o = {};
    header.forEach((h, i) => (o[h] = cells[i]));
    return o;
  });
}
const csv = parseCsv(fs.readFileSync(path.join(ROOT, "public", "ymed_products.csv"), "utf-8"));
const sample = csv.filter((_, i) => i % 4 === 0); // ~45 itens representativos
const unitsPerBox = (cat) => (cat === "sabonete" ? 12 : 6);
const sheetRows = [
  ["product_id", "produto", "categoria", "preco_varejo_brl", "preco_distribuidor_brl", "unidades_por_caixa", "moq_caixas"],
  ...sample.map((p) => {
    const varejo = Number(p.price_brl);
    const distrib = Math.round(varejo * 0.82 * 100) / 100;
    return [p.product_id, p.name, p.category, varejo, distrib, unitsPerBox(p.category), 10];
  }),
];
const ws = XLSX.utils.aoa_to_sheet(sheetRows);
ws["!cols"] = [{ wch: 10 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 12 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Tabela de Preços 2025");
XLSX.writeFile(wb, path.join(OUT_DIR, "tabela-precos.xlsx"));

console.log("Documentos internos gerados em data/corporate/:");
for (const f of fs.readdirSync(OUT_DIR)) {
  const st = fs.statSync(path.join(OUT_DIR, f));
  console.log(`  ${f} (${(st.size / 1024).toFixed(1)} KB)`);
}
