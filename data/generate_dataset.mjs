/**
 * Gera o dataset sintético realista de produtos YMED (versão Node, sem Python).
 * Catálogo ampliado (~180 SKUs) para demonstrar robustez/escala.
 * Saída: ymed_products.csv (em data/ e public/).
 *
 * Determinístico: PRNG semeado (mulberry32, seed 42) — builds reproduzíveis.
 * Mantém EXATAMENTE o mesmo schema de colunas usado por lib/data.ts e os gráficos.
 *
 * Uso: node data/generate_dataset.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── PRNG determinístico ───────────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const uniform = (lo, hi) => lo + (hi - lo) * rng();
// Box-Muller usando o mesmo PRNG
function normal(mean, sd) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + sd * z;
}

// ── Definições do catálogo ────────────────────────────────────────────────────
const FRAGRANCES = {
  sabonete: ["Lavanda", "Rosa", "Coco", "Hortelã", "Camomila", "Sem Perfume", "Erva-Doce", "Aloe Vera"],
  shampoo: ["Lavanda", "Hortelã", "Coco", "Aloe Vera", "Camomila", "Rosa", "Sem Perfume", "Erva-Doce"],
  detergente: ["Sem Perfume", "Limão", "Coco", "Lavanda"],
};
const SUBCATS = {
  sabonete: ["hidratante", "suave", "nutritivo", "antibacteriano", "neutro", "premium", "sport", "bebê"],
  shampoo: ["hidratante", "anticaspa", "nutritivo", "sem sal", "suave", "brilho", "neutro", "volume", "reconstrução", "premium", "bebê", "sport"],
  detergente: ["neutro", "desengordurante", "biodegradável", "concentrado", "antibacteriano", "suave", "premium", "bebê"],
};
const SIZES = {
  sabonete: [80, 90, 150, 200],
  shampoo: [200, 250, 300, 400],
  detergente: [500, 1000],
};
const PH_BASE = { sabonete: 5.5, shampoo: 5.0, detergente: 7.3 };
const PRICE_PER_UNIT = { sabonete: 0.05, shampoo: 0.05, detergente: 0.012 }; // R$/ml ou R$/g
const PREMIUM_MULT = {
  premium: 1.65,
  bebê: 1.35,
  antibacteriano: 1.18,
  reconstrução: 1.25,
  "sem sal": 1.3,
  nutritivo: 1.1,
};
const PH_SUBCAT_OFFSET = { antibacteriano: 0.6, neutro: -0.4, bebê: -0.2 };

// Quantos SKUs por categoria
const COUNTS = { sabonete: 70, shampoo: 60, detergente: 50 };

const BASE_SALES = {
  sabonete: { hidratante: 800, suave: 900, nutritivo: 600, antibacteriano: 700, neutro: 500, premium: 400, sport: 550, bebê: 450 },
  shampoo: { hidratante: 500, anticaspa: 600, nutritivo: 450, "sem sal": 350, suave: 480, brilho: 420, neutro: 380, volume: 400, reconstrução: 360, premium: 300, bebê: 320, sport: 400 },
  detergente: { neutro: 1200, desengordurante: 1100, biodegradável: 700, concentrado: 800, antibacteriano: 900, suave: 750, premium: 550, bebê: 600 },
};

const MONTHLY_FACTOR = {
  sabonete: [0.9, 0.85, 0.9, 0.95, 1.0, 1.1, 1.05, 1.0, 0.95, 1.0, 1.1, 1.3],
  shampoo: [0.95, 0.9, 0.95, 1.0, 1.05, 1.1, 1.0, 1.0, 1.0, 1.05, 1.1, 1.2],
  detergente: [1.1, 1.0, 0.95, 0.9, 0.95, 1.0, 1.05, 1.0, 0.95, 1.0, 1.05, 1.1],
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function seasonalSales(base, category) {
  const out = [];
  for (let m = 0; m < 12; m++) {
    let seasonality = 1 + 0.25 * Math.sin((2 * Math.PI * (m - 5)) / 12);
    seasonality *= MONTHLY_FACTOR[category][m];
    const noise = normal(1.0, 0.05);
    out.push(Math.max(Math.round(base * seasonality * noise), 10));
  }
  return out;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Geração combinatória determinística (combos únicos → nomes únicos) ─────────
const products = [];
let counter = 0;
for (const category of ["sabonete", "shampoo", "detergente"]) {
  const subcats = SUBCATS[category];
  const frags = FRAGRANCES[category];
  const sizes = SIZES[category];
  const unit = category === "sabonete" ? "g" : "ml";

  // Enumera combinações distintas (subcat × fragrância × tamanho), embaralha de forma
  // determinística (bom espalhamento entre dimensões) e pega as N primeiras.
  const combos = [];
  for (const sub of subcats) {
    for (const fragrance of frags) {
      for (const size of sizes) combos.push({ sub, fragrance, size });
    }
  }
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }
  const chosen = combos.slice(0, COUNTS[category]);

  for (const { sub, fragrance, size } of chosen) {
    counter++;
    const weight_g = unit === "g" ? size : Math.round(size * 1.04);

    const phOffset = PH_SUBCAT_OFFSET[sub] ?? 0;
    const ph_level = Math.round((PH_BASE[category] + phOffset + uniform(-0.1, 0.1)) * 10) / 10;

    const premiumMult = PREMIUM_MULT[sub] ?? 1.0;
    const price_brl = Math.round(size * PRICE_PER_UNIT[category] * premiumMult * uniform(0.92, 1.12) * 100) / 100;
    const cost_brl = Math.round(price_brl * uniform(0.38, 0.46) * 100) / 100;

    const base = Math.round((BASE_SALES[category][sub] ?? 500) * uniform(0.8, 1.2));
    const monthly = seasonalSales(base, category);
    const total_sales_2025 = monthly.reduce((s, v) => s + v, 0);
    const total_revenue_2025 = Math.round(total_sales_2025 * price_brl * 100) / 100;

    const name = `YMED ${fragrance} ${cap(sub)} ${size}${unit}`;

    const row = {
      product_id: `P${String(counter).padStart(3, "0")}`,
      name,
      category,
      sub_category: sub,
      size_ml_or_g: size,
      weight_g,
      ph_level,
      fragrance,
      price_brl,
      cost_brl,
    };
    MONTHS.forEach((m, idx) => {
      row[`sales_${m}`] = monthly[idx];
    });
    row.total_sales_2025 = total_sales_2025;
    row.total_revenue_2025 = total_revenue_2025;
    products.push(row);
  }
}

// ── Escrever CSV ──────────────────────────────────────────────────────────────
const HEADER = [
  "product_id", "name", "category", "sub_category", "size_ml_or_g", "weight_g",
  "ph_level", "fragrance", "price_brl", "cost_brl",
  ...MONTHS.map((m) => `sales_${m}`),
  "total_sales_2025", "total_revenue_2025",
];

function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const lines = [HEADER.join(",")];
for (const row of products) {
  lines.push(HEADER.map((h) => csvCell(row[h])).join(","));
}
const csv = lines.join("\n") + "\n";

const targets = [path.join(ROOT, "data", "ymed_products.csv"), path.join(ROOT, "public", "ymed_products.csv")];
for (const t of targets) fs.writeFileSync(t, csv, "utf-8");

const byCat = {};
for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + 1;
console.log(`Dataset gerado: ${products.length} produtos`);
console.log("Por categoria:", byCat);
console.log("Arquivos:", targets.map((t) => path.relative(ROOT, t)).join(", "));
