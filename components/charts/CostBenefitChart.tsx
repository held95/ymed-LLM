"use client";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CostBenefit } from "@/types";

const CAT_COLORS: Record<string, string> = {
  sabonete: "#16a34a",
  shampoo: "#2563eb",
  detergente: "#d97706",
};

const CAT_LABELS: Record<string, string> = {
  sabonete: "Sabonetes",
  shampoo: "Shampoos",
  detergente: "Detergentes",
};

export default function CostBenefitChart({ data }: { data: CostBenefit[] }) {
  const byCategory = ["sabonete", "shampoo", "detergente"].map((cat) => ({
    cat,
    points: data
      .filter((d) => d.category === cat)
      .map((d) => ({ x: d.weight_g, y: d.price_brl, name: d.name, ratio: d.price_per_gram })),
  }));

  return (
    <div className="w-full h-72">
      <p className="text-xs text-gray-500 mb-1 text-center">
        Eixo X: Gramatura (g/ml) · Eixo Y: Preço (R$) · Pontos próximos ao eixo X = melhor custo-benefício
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="x" name="Gramatura" unit="g" tick={{ fontSize: 11 }} />
          <YAxis dataKey="y" name="Preço" unit=" R$" tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white border border-gray-200 rounded p-2 text-xs shadow">
                  <p className="font-semibold">{d.name}</p>
                  <p>Gramatura: {d.x}g</p>
                  <p>Preço: R$ {d.y.toFixed(2)}</p>
                  <p>R$/g: {d.ratio.toFixed(4)}</p>
                </div>
              );
            }}
          />
          <Legend formatter={(v) => CAT_LABELS[v] ?? v} />
          {byCategory.map(({ cat, points }) => (
            <Scatter
              key={cat}
              name={cat}
              data={points}
              fill={CAT_COLORS[cat]}
              opacity={0.8}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
