"use client";
import { useEffect, useRef, useState } from "react";
import { ProductAnalytics, ProductListItem } from "@/types";
import ProductDashboard from "./ProductDashboard";

const CATEGORY_LABEL: Record<string, string> = {
  sabonete: "Sabonetes",
  shampoo: "Shampoos",
  detergente: "Detergentes",
};

export default function ProductsAnalytics() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<ProductListItem | null>(null);
  const [data, setData] = useState<ProductAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products-filters")
      .then((r) => r.json())
      .then((d) => setProducts(d.products_list ?? []))
      .catch(() => setError("Não foi possível carregar a lista de produtos."));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = products.filter((p) => {
    if (category && p.category !== category) return false;
    if (search.length < 2) return false;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.product_id.toLowerCase().includes(q);
  });

  async function selectProduct(p: ProductListItem) {
    setSelected(p);
    setSearch(p.name);
    setShowDropdown(false);
    setIsLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/product/${encodeURIComponent(p.product_id)}`);
      if (!res.ok) throw new Error("erro");
      setData(await res.json());
    } catch {
      setError("Erro ao carregar o produto. Verifique se a chave de API está configurada.");
    } finally {
      setIsLoading(false);
    }
  }

  const categories = [...new Set(products.map((p) => p.category))].sort();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Análise por Produto</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Busque um SKU do catálogo YMED para ver KPIs, evolução mensal, previsão e análise da IA.
          </p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c] ?? c}
              </option>
            ))}
          </select>

          <div className="relative flex-1" ref={boxRef}>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Digite o nome ou o código do produto (ex.: Lavanda, P012)…"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {filtered.slice(0, 25).map((p) => (
                  <button
                    key={p.product_id}
                    onClick={() => selectProduct(p)}
                    className="w-full text-left px-3 py-2 hover:bg-green-50 border-b border-gray-50 last:border-0"
                  >
                    <div className="text-sm text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-400">
                      {CATEGORY_LABEL[p.category] ?? p.category} · {p.product_id}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && search.length >= 2 && filtered.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
                Nenhum produto encontrado
              </div>
            )}
          </div>
        </div>

        {/* States */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {!isLoading && data && <ProductDashboard data={data} />}

        {!isLoading && !data && !error && (
          <div className="text-center text-gray-400 text-sm py-16">
            <div className="text-4xl mb-2">📦</div>
            Selecione um produto para começar a análise.
          </div>
        )}
      </div>
    </div>
  );
}
