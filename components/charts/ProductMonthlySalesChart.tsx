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
import { ProductMonthPoint } from "@/types";

export default function ProductMonthlySalesChart({ data }: { data: ProductMonthPoint[] }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={48} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} width={36} />
          <Tooltip
            formatter={(value, _name, item) => [
              `${Number(value).toLocaleString("pt-BR")} un`,
              item?.payload?.kind === "forecast" ? "Previsão" : "Vendas",
            ]}
          />
          <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
            {data.map((p, i) => (
              <Cell key={i} fill={p.kind === "forecast" ? "#86efac" : "#16a34a"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#16a34a" }} /> Vendas 2025
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#86efac" }} /> Previsão Q1/2026
        </span>
      </div>
    </div>
  );
}
