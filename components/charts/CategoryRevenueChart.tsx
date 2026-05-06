"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS: Record<string, string> = {
  sabonete: "#16a34a",
  shampoo: "#2563eb",
  detergente: "#d97706",
};

const LABELS: Record<string, string> = {
  sabonete: "Sabonetes",
  shampoo: "Shampoos",
  detergente: "Detergentes",
};

export default function CategoryRevenueChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key] ?? key,
    value: Math.round(value),
    color: COLORS[key] ?? "#6b7280",
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) =>
              `${name}: ${((value / total) * 100).toFixed(1)}%`
            }
            labelLine={false}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              "Receita",
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
