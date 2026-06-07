/**
 * Calcula os slices analíticos a partir de ymed_products.csv e gera forecasts.json
 * (versão Node — substitui run_forecasting.py, sem dependência de statsmodels/Python).
 *
 * Mantém EXATAMENTE o shape consumido por types/index.ts (interface Forecasts),
 * pelos gráficos e por /api/chat. Previsão: tendência linear (OLS) sobre os 12 meses
 * — leve, determinística e sem travamentos (substitui o ARIMA do pipeline Python).
 *
 * Uso: node data/build_analytics.mjs   (rode generate_dataset.mjs antes)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_LABELS = ["Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25", "Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25"];
const FORECAST_LABELS = ["Jan/26", "Fev/26", "Mar/26"];

const CATEGORIES = ["sabonete", "shampoo", "detergente"];

// ── Ler CSV (parser simples; nossos dados não têm vírgulas dentro de campos) ───
function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/);
  const header = rows[0].split(",");
  return rows.slice(1).map((line) => {
    // suporta campos entre aspas com vírgulas
    const cells = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    const obj = {};
    header.forEach((h, idx) => (obj[h] = cells[idx]));
    return obj;
  });
}

const csvPath = path.join(ROOT, "public", "ymed_products.csv");
const raw = parseCsv(fs.readFileSync(csvPath, "utf-8"));

const num = (v) => Number(v);
const products = raw.map((r) => ({
  product_id: r.product_id,
  name: r.name,
  category: r.category,
  sub_category: r.sub_category,
  size_ml_or_g: num(r.size_ml_or_g),
  weight_g: num(r.weight_g),
  ph_level: num(r.ph_level),
  fragrance: r.fragrance,
  price_brl: num(r.price_brl),
  cost_brl: num(r.cost_brl),
  monthly: MONTHS.map((m) => num(r[`sales_${m}`])),
  total_sales_2025: num(r.total_sales_2025),
  total_revenue_2025: num(r.total_revenue_2025),
}));

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

// ── 1. Previsão por categoria (tendência linear OLS sobre 12 meses) ───────────
function forecastCategory(category) {
  const subset = products.filter((p) => p.category === category);
  const history = [];
  for (let m = 0; m < 12; m++) {
    history.push(subset.reduce((s, p) => s + p.monthly[m], 0));
  }
  // OLS: y = a + b*t, t = 0..11
  const n = 12;
  const xs = Array.from({ length: n }, (_, i) => i);
  const sx = xs.reduce((s, x) => s + x, 0);
  const sy = history.reduce((s, y) => s + y, 0);
  const sxx = xs.reduce((s, x) => s + x * x, 0);
  const sxy = xs.reduce((s, x, i) => s + x * history[i], 0);
  const denom = n * sxx - sx * sx;
  const b = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const a = (sy - b * sx) / n;
  const forecast = [12, 13, 14].map((t) => Math.max(0, Math.round(a + b * t)));
  return {
    history: history.map((v) => Math.round(v)),
    forecast,
    months_history: MONTH_LABELS,
    months_forecast: FORECAST_LABELS,
  };
}
const forecast_by_category = {};
for (const c of CATEGORIES) forecast_by_category[c] = forecastCategory(c);

// ── 2. ABC Classification ─────────────────────────────────────────────────────
const sorted = [...products].sort((a, b) => b.total_revenue_2025 - a.total_revenue_2025);
const totalRev = sorted.reduce((s, p) => s + p.total_revenue_2025, 0);
let cum = 0;
const abc_classification = sorted.map((p) => {
  cum += p.total_revenue_2025;
  const cumPct = (cum / totalRev) * 100;
  const abc_class = cumPct <= 70 ? "A" : cumPct <= 90 ? "B" : "C";
  return {
    product_id: p.product_id,
    name: p.name,
    category: p.category,
    abc_class,
    total_revenue_2025: round(p.total_revenue_2025),
    revenue_share_pct: round((p.total_revenue_2025 / totalRev) * 100),
  };
});

// ── 3. Top 10 produtos por unidades ───────────────────────────────────────────
const top_products = [...products]
  .sort((a, b) => b.total_sales_2025 - a.total_sales_2025)
  .slice(0, 10)
  .map((p) => ({
    product_id: p.product_id,
    name: p.name,
    category: p.category,
    total_sales_2025: p.total_sales_2025,
    total_revenue_2025: round(p.total_revenue_2025),
    price_brl: p.price_brl,
  }));

// ── 4. Receita / unidades / contagem por categoria ────────────────────────────
const category_revenue = {};
const category_units = {};
const category_products_count = {};
for (const c of CATEGORIES) {
  const subset = products.filter((p) => p.category === c);
  category_revenue[c] = round(subset.reduce((s, p) => s + p.total_revenue_2025, 0));
  category_units[c] = subset.reduce((s, p) => s + p.total_sales_2025, 0);
  category_products_count[c] = subset.length;
}

// ── 5. pH vs Vendas (médias por faixa) ────────────────────────────────────────
const PH_BINS = [
  { label: "4.0–5.0", lo: 4.0, hi: 5.0 },
  { label: "5.0–6.0", lo: 5.0, hi: 6.0 },
  { label: "6.0–7.0", lo: 6.0, hi: 7.0 },
  { label: "7.0–8.0", lo: 7.0, hi: 8.0 },
  { label: "8.0–9.5", lo: 8.0, hi: 9.5 },
];
const ph_vs_sales = PH_BINS.map((bin) => {
  const inBin = products.filter((p) => p.ph_level > bin.lo && p.ph_level <= bin.hi);
  const avg = inBin.length ? inBin.reduce((s, p) => s + p.total_sales_2025, 0) / inBin.length : 0;
  return { ph_range: bin.label, avg_sales: Math.round(avg) };
}).filter((b) => b.avg_sales > 0);

// ── 6. Essências mais populares ───────────────────────────────────────────────
const fragMap = {};
for (const p of products) fragMap[p.fragrance] = (fragMap[p.fragrance] || 0) + p.total_sales_2025;
const fragTotal = Object.values(fragMap).reduce((s, v) => s + v, 0);
const fragrance_share = Object.entries(fragMap)
  .map(([fragrance, total_units]) => ({
    fragrance,
    total_units,
    pct: round((total_units / fragTotal) * 100, 1),
  }))
  .sort((a, b) => b.pct - a.pct);

// ── 7. Custo-benefício (preço / gramatura) ────────────────────────────────────
const cost_benefit = [...products]
  .map((p) => ({
    product_id: p.product_id,
    name: p.name,
    category: p.category,
    price_brl: p.price_brl,
    weight_g: p.weight_g,
    price_per_gram: round(p.price_brl / p.weight_g, 4),
    total_sales_2025: p.total_sales_2025,
  }))
  .sort((a, b) => a.price_per_gram - b.price_per_gram);

// ── 8. Summary ────────────────────────────────────────────────────────────────
const summary = {
  total_products: products.length,
  total_revenue_2025: round(products.reduce((s, p) => s + p.total_revenue_2025, 0)),
  total_units_2025: products.reduce((s, p) => s + p.total_sales_2025, 0),
  avg_price_brl: round(products.reduce((s, p) => s + p.price_brl, 0) / products.length),
  avg_ph: round(products.reduce((s, p) => s + p.ph_level, 0) / products.length),
};

const output = {
  summary,
  forecast_by_category,
  abc_classification,
  top_products,
  category_revenue,
  category_units,
  category_products_count,
  ph_vs_sales,
  fragrance_share,
  cost_benefit,
};

const json = JSON.stringify(output, null, 2);
for (const t of [path.join(ROOT, "data", "forecasts.json"), path.join(ROOT, "public", "forecasts.json")]) {
  fs.writeFileSync(t, json, "utf-8");
}

const abcCounts = abc_classification.reduce((m, p) => ((m[p.abc_class] = (m[p.abc_class] || 0) + 1), m), {});
console.log("forecasts.json gerado com sucesso!");
console.log(`Produtos: ${summary.total_products} | Receita: R$ ${summary.total_revenue_2025.toLocaleString("pt-BR")}`);
console.log(`Unidades: ${summary.total_units_2025.toLocaleString("pt-BR")}`);
console.log("ABC:", abcCounts);
console.log("Top 3:", top_products.slice(0, 3).map((p) => `${p.name} (${p.total_sales_2025})`).join(" | "));
