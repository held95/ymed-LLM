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
import { TopProduct } from "@/types";

const COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0",
                 "#dcfce7", "#15803d", "#166534", "#14532d", "#052e16"];

export default function TopProductsChart({ data }: { data: TopProduct[] }) {
  const formatted = data.map((p) => ({
    name: p.name.replace("YMED ", "").substring(0, 22),
    vendas: p.total_sales_2025,
    receita: p.total_revenue_2025,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={148}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "vendas"
                ? [`${Number(value).toLocaleString("pt-BR")} un`, "Vendas"]
                : [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"]
            }
          />
          <Bar dataKey="vendas" radius={[0, 4, 4, 0]}>
            {formatted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
