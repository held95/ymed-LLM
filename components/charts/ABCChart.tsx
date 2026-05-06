"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ABCProduct } from "@/types";

const ABC_COLORS: Record<string, string> = {
  A: "#16a34a",
  B: "#eab308",
  C: "#ef4444",
};

const ABC_DOT_CLASS: Record<string, string> = {
  A: "inline-block w-3 h-3 rounded-sm bg-green-600",
  B: "inline-block w-3 h-3 rounded-sm bg-yellow-400",
  C: "inline-block w-3 h-3 rounded-sm bg-red-500",
};

const ABC_DESCRIPTION: Record<string, string> = {
  A: "Classe A — Alto valor (70% da receita)",
  B: "Classe B — Médio valor (70–90%)",
  C: "Classe C — Baixo valor (10% restante)",
};

export default function ABCChart({ data }: { data: ABCProduct[] }) {
  const top20 = data.slice(0, 20);

  return (
    <div className="w-full">
      <div className="flex gap-3 mb-2 text-xs justify-center">
        {["A", "B", "C"].map((cls) => (
          <span key={cls} className="flex items-center gap-1">
            <span className={ABC_DOT_CLASS[cls]} />
            {ABC_DESCRIPTION[cls]}
          </span>
        ))}
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top20}
            layout="vertical"
            margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tickFormatter={(v) =>
                `R$${(v / 1000).toFixed(0)}k`
              }
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 9 }}
              tickFormatter={(v: string) => v.replace("YMED ", "").substring(0, 24)}
            />
            <Tooltip
              formatter={(value, _name, props) => [
                `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — Classe ${(props.payload as ABCProduct).abc_class}`,
                "Receita 2025",
              ]}
            />
            <Bar dataKey="total_revenue_2025" radius={[0, 4, 4, 0]}>
              {top20.map((entry, i) => (
                <Cell key={i} fill={ABC_COLORS[entry.abc_class]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
