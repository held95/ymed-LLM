"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FragranceShare } from "@/types";

const COLORS = [
  "#16a34a", "#2563eb", "#d97706", "#9333ea",
  "#db2777", "#0891b2", "#65a30d", "#ea580c",
];

export default function FragranceChart({ data }: { data: FragranceShare[] }) {
  const sorted = [...data].sort((a, b) => b.pct - a.pct);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={sorted}
            cx="50%"
            cy="50%"
            outerRadius={95}
            dataKey="pct"
            nameKey="fragrance"
            label={({ name, percent }) =>
              (percent ?? 0) * 100 >= 8
                ? `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                : ""
            }
          >
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, props) => {
              const p = props.payload as FragranceShare;
              return [
                `${Number(value).toFixed(1)}% (${p.total_units?.toLocaleString("pt-BR")} un)`,
                p.fragrance,
              ];
            }}
          />
          <Legend
            formatter={(value) => value}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
