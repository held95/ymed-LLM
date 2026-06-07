import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { getProducts } from "@/lib/products";
import { Product, ProductAnalytics, ProductKpis, ProductMonthPoint } from "@/types";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const FORECAST_LABELS = ["Jan/26", "Fev/26", "Mar/26"];

function monthlyOf(p: Product): number[] {
  return MONTHS.map((m) => Number(p[`sales_${m}` as keyof Product] ?? 0));
}

/** Regressão linear simples (OLS) sobre os 12 meses → previsão dos próximos 3. */
function forecastNext(monthly: number[]): number[] {
  const n = monthly.length;
  const xs = monthly.map((_, i) => i);
  const sx = xs.reduce((s, x) => s + x, 0);
  const sy = monthly.reduce((s, y) => s + y, 0);
  const sxx = xs.reduce((s, x) => s + x * x, 0);
  const sxy = xs.reduce((s, x, i) => s + x * monthly[i], 0);
  const denom = n * sxx - sx * sx;
  const b = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const a = (sy - b * sx) / n;
  return [12, 13, 14].map((t) => Math.max(0, Math.round(a + b * t)));
}

function buildKpis(product: Product, all: Product[]): { kpis: ProductKpis; series: ProductMonthPoint[] } {
  const monthly = monthlyOf(product);
  const total_units_2025 = Number(product.total_sales_2025);
  const total_revenue_2025 = Number(product.total_revenue_2025);
  const price_brl = Number(product.price_brl);
  const cost_brl = Number(product.cost_brl);
  const weight_g = Number(product.weight_g);

  const avg_monthly_units = Math.round(total_units_2025 / 12);
  let bestIdx = 0;
  monthly.forEach((v, i) => {
    if (v > monthly[bestIdx]) bestIdx = i;
  });
  const margin_pct = price_brl > 0 ? Math.round(((price_brl - cost_brl) / price_brl) * 1000) / 10 : 0;
  const profit_per_unit = Math.round((price_brl - cost_brl) * 100) / 100;
  const price_per_gram = weight_g > 0 ? Math.round((price_brl / weight_g) * 10000) / 10000 : 0;

  // Ranking por receita e classe ABC (cumulativa) entre todos os produtos.
  const ranked = [...all].sort(
    (a, b) => Number(b.total_revenue_2025) - Number(a.total_revenue_2025)
  );
  const total_ranked = ranked.length;
  const totalRev = ranked.reduce((s, p) => s + Number(p.total_revenue_2025), 0);
  const rank_revenue = ranked.findIndex((p) => p.product_id === product.product_id) + 1 || null;
  let abc_class: "A" | "B" | "C" | null = null;
  if (rank_revenue) {
    let cum = 0;
    for (let i = 0; i < rank_revenue; i++) cum += Number(ranked[i].total_revenue_2025);
    const cumPct = (cum / totalRev) * 100;
    abc_class = cumPct <= 70 ? "A" : cumPct <= 90 ? "B" : "C";
  }
  const revenue_share_pct = totalRev > 0 ? Math.round((total_revenue_2025 / totalRev) * 1000) / 10 : null;

  // Tendência: 2º semestre vs 1º semestre.
  const firstHalf = monthly.slice(0, 6).reduce((s, v) => s + v, 0);
  const secondHalf = monthly.slice(6).reduce((s, v) => s + v, 0);
  const trend_pct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 1000) / 10 : null;

  const forecast = forecastNext(monthly);
  const forecast_q1_2026_units = forecast.reduce((s, v) => s + v, 0);

  const series: ProductMonthPoint[] = [
    ...monthly.map((sales, i) => ({ month: MONTH_LABELS[i], sales, kind: "real" as const })),
    ...forecast.map((sales, i) => ({ month: FORECAST_LABELS[i], sales, kind: "forecast" as const })),
  ];

  const kpis: ProductKpis = {
    total_units_2025,
    total_revenue_2025,
    avg_monthly_units,
    best_month: MONTH_LABELS[bestIdx],
    best_month_units: monthly[bestIdx],
    price_brl,
    cost_brl,
    margin_pct,
    profit_per_unit,
    price_per_gram,
    abc_class,
    revenue_share_pct,
    rank_revenue,
    total_ranked,
    forecast_q1_2026_units,
    trend_pct,
  };
  return { kpis, series };
}

async function buildInsight(product: Product, kpis: ProductKpis): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "";
  try {
    const client = getAnthropicClient();
    const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const data = {
      produto: product.name,
      categoria: product.category,
      essencia: product.fragrance,
      receita_2025: brl(kpis.total_revenue_2025),
      unidades_2025: kpis.total_units_2025,
      margem_pct: kpis.margin_pct,
      lucro_por_unidade: brl(kpis.profit_per_unit),
      classe_abc: kpis.abc_class,
      ranking_receita: kpis.rank_revenue,
      total_produtos: kpis.total_ranked,
      participacao_receita_pct: kpis.revenue_share_pct,
      melhor_mes: `${kpis.best_month} (${kpis.best_month_units} un)`,
      tendencia_2sem_vs_1sem_pct: kpis.trend_pct,
      previsao_unidades_q1_2026: kpis.forecast_q1_2026_units,
    };
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 240,
      temperature: 0.1,
      system:
        "Você é um analista de vendas da YMED (produtos de higiene e limpeza). Resuma o desempenho de UM produto em 2 a 3 frases curtas, em português, citando números concretos (receita 2025, unidades, margem, classe ABC, ranking e tendência). Destaque se é classe A (alta importância) e se a tendência é de crescimento ou queda. Não invente dados além dos fornecidos. Texto simples, sem markdown.",
      messages: [{ role: "user", content: `DADOS DO PRODUTO:\n${JSON.stringify(data, null, 2)}` }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  } catch (err) {
    console.error("[/api/product] insight error:", err);
    return "";
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const products = getProducts();
    const product = products.find((p) => p.product_id === id);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const { kpis, series } = buildKpis(product, products);
    const insight = await buildInsight(product, kpis);

    const payload: ProductAnalytics = {
      product: {
        product_id: product.product_id,
        name: product.name,
        category: product.category,
        sub_category: product.sub_category,
        fragrance: product.fragrance,
        ph_level: Number(product.ph_level),
        size_ml_or_g: Number(product.size_ml_or_g),
      },
      kpis,
      series,
      insight,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[/api/product] error:", err);
    return NextResponse.json({ error: "Erro interno ao buscar o produto." }, { status: 500 });
  }
}
