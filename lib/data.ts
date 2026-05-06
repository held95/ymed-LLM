import fs from "fs";
import path from "path";
import { Forecasts } from "@/types";

let _forecasts: Forecasts | null = null;

export function getForecasts(): Forecasts {
  if (_forecasts) return _forecasts;
  const filePath = path.join(process.cwd(), "public", "forecasts.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _forecasts = JSON.parse(raw) as Forecasts;
  return _forecasts;
}
