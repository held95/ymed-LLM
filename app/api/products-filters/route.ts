import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { ProductListItem } from "@/types";

export async function GET() {
  try {
    const products = getProducts();
    const categories = [...new Set(products.map((p) => p.category))].sort();
    const products_list: ProductListItem[] = products
      .map((p) => ({ product_id: p.product_id, name: p.name, category: p.category }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return NextResponse.json({ categories, products_list });
  } catch (err) {
    console.error("[/api/products-filters] error:", err);
    return NextResponse.json({ error: "Erro ao carregar filtros." }, { status: 500 });
  }
}
