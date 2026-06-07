import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { Product } from "@/types";

let _products: Product[] | null = null;

/** Lê public/ymed_products.csv uma vez e mantém em cache (singleton de módulo). */
export function getProducts(): Product[] {
  if (_products) return _products;
  const filePath = path.join(process.cwd(), "public", "ymed_products.csv");
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = Papa.parse<Product>(raw, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  _products = (parsed.data as Product[]).filter((p) => p && p.product_id);
  return _products;
}
