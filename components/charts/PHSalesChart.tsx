"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PHVsSales } from "@/types";

// pH color gradient: ácido (verde) → neutro (amarelo) → alcalino (azul)
const PH_COLORS = ["#16a34a", "#22c55e", "#eab308", "#f97316", "#3b82f6"];

export default function PHSalesChart({ data }: { data: PHVsSales[] }) {
  return (
    <div className="w-full h-64">
      <p className="text-xs text-gray-500 mb-1 text-center">
        Média de unidades vendidas por faixa de pH
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="ph_range" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString("pt-BR")} un/produto`,
              "Média de Vendas",
            ]}
          />
          <Bar dataKey="avg_sales" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PH_COLORS[i % PH_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
