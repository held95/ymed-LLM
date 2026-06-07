import { ReactNode } from "react";

type Accent = "green" | "emerald" | "amber" | "gray" | "rose";

interface Props {
  label: string;
  value: ReactNode;
  caption?: string;
  icon?: string;
  accent?: Accent;
  highlight?: boolean;
}

const ACCENT: Record<Accent, string> = {
  green: "text-green-700",
  emerald: "text-emerald-700",
  amber: "text-amber-600",
  gray: "text-gray-700",
  rose: "text-rose-600",
};

export default function KpiCard({
  label,
  value,
  caption,
  icon,
  accent = "gray",
  highlight = false,
}: Props) {
  if (highlight) {
    return (
      <div className="rounded-2xl p-4 shadow-sm bg-linear-to-br from-green-600 to-green-700 text-white">
        <div className="flex items-center gap-1.5 mb-1">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-[11px] uppercase tracking-wide font-semibold text-green-100">
            {label}
          </span>
        </div>
        <div className="text-xl font-bold leading-tight">{value}</div>
        {caption && <div className="text-[11px] text-green-100 mt-0.5">{caption}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
          {label}
        </span>
      </div>
      <div className={`text-xl font-bold leading-tight ${ACCENT[accent]}`}>{value}</div>
      {caption && <div className="text-[11px] text-gray-400 mt-0.5">{caption}</div>}
    </div>
  );
}
