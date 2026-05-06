"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CategoryForecast } from "@/types";

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

export default function ForecastLineChart({
  data,
}: {
  data: Record<string, CategoryForecast>;
}) {
  const categories = Object.keys(data);
  const first = data[categories[0]];
  const allMonths = [...first.months_history, ...first.months_forecast];

  const chartData = allMonths.map((month, i) => {
    const row: Record<string, number | string> = { month };
    categories.forEach((cat) => {
      const catData = data[cat];
      if (i < catData.history.length) {
        row[cat] = catData.history[i];
      } else {
        row[`${cat}_forecast`] = catData.forecast[i - catData.history.length];
      }
    });
    return row;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, name) => {
              const cat = String(name).replace("_forecast", "");
              const label = LABELS[cat] ?? cat;
              return [`${Number(value).toLocaleString("pt-BR")} un`, label];
            }}
          />
          <Legend
            formatter={(value) => LABELS[value.replace("_forecast", "")] ?? value}
          />
          <ReferenceLine x="Dez/25" stroke="#94a3b8" strokeDasharray="4 2" label={{ value: "Previsão →", position: "top", fontSize: 10 }} />
          {categories.map((cat) => (
            <>
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={COLORS[cat]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                key={`${cat}_forecast`}
                type="monotone"
                dataKey={`${cat}_forecast`}
                stroke={COLORS[cat]}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 4, fill: COLORS[cat] }}
                connectNulls
              />
            </>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
