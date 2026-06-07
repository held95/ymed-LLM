"use client";
import dynamic from "next/dynamic";
import { ProductAnalytics } from "@/types";
import KpiCard from "./KpiCard";

const ProductMonthlySalesChart = dynamic(() => import("./charts/ProductMonthlySalesChart"), {
  ssr: false,
});

const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const int = (v: number) => v.toLocaleString("pt-BR");

const CATEGORY_LABEL: Record<string, string> = {
  sabonete: "Sabonete",
  shampoo: "Shampoo",
  detergente: "Detergente",
};

export default function ProductDashboard({ data }: { data: ProductAnalytics }) {
  const { product, kpis, series, insight } = data;
  const initials = product.name.replace("YMED ", "").slice(0, 2).toUpperCase();
  const trendUp = (kpis.trend_pct ?? 0) >= 0;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">{product.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {CATEGORY_LABEL[product.category] ?? product.category}
              </span>
              <span className="text-xs text-gray-500">{product.sub_category}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">Essência: {product.fragrance}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">pH {product.ph_level}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{product.size_ml_or_g}{product.category === "sabonete" ? "g" : "ml"}</span>
            </div>
          </div>
          {kpis.abc_class && (
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                kpis.abc_class === "A"
                  ? "bg-emerald-100 text-emerald-700"
                  : kpis.abc_class === "B"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Classe {kpis.abc_class}
            </span>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Receita 2025"
          value={brl(kpis.total_revenue_2025)}
          caption={kpis.revenue_share_pct != null ? `${kpis.revenue_share_pct}% da receita total` : undefined}
          icon="💰"
          highlight
        />
        <KpiCard label="Unidades 2025" value={`${int(kpis.total_units_2025)} un`} caption={`Média ${int(kpis.avg_monthly_units)}/mês`} icon="📦" accent="green" />
        <KpiCard
          label="Ranking de receita"
          value={kpis.rank_revenue != null ? `#${kpis.rank_revenue}` : "—"}
          caption={`de ${int(kpis.total_ranked)} produtos`}
          icon="🏆"
          accent="emerald"
        />
        <KpiCard
          label="Tendência (2º vs 1º sem.)"
          value={kpis.trend_pct != null ? `${trendUp ? "+" : ""}${kpis.trend_pct}%` : "—"}
          caption={trendUp ? "crescimento" : "queda"}
          icon={trendUp ? "📈" : "📉"}
          accent={trendUp ? "emerald" : "rose"}
        />
        <KpiCard label="Preço unitário" value={brl(kpis.price_brl)} caption={`Custo ${brl(kpis.cost_brl)}`} icon="🏷️" accent="gray" />
        <KpiCard label="Margem bruta" value={`${kpis.margin_pct}%`} caption={`Lucro ${brl(kpis.profit_per_unit)}/un`} icon="📊" accent="emerald" />
        <KpiCard label="Melhor mês" value={kpis.best_month} caption={`${int(kpis.best_month_units)} un`} icon="🗓️" accent="green" />
        <KpiCard label="Previsão Q1/2026" value={`${int(kpis.forecast_q1_2026_units)} un`} caption="Jan–Mar (tendência)" icon="🔮" accent="gray" />
      </div>

      {/* AI insight */}
      {insight && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide mb-1">
            Análise do assistente YMED
          </p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{insight}</p>
        </div>
      )}

      {/* Monthly sales chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Vendas mensais 2025 + previsão</h3>
        <ProductMonthlySalesChart data={series} />
      </div>
    </div>
  );
}
