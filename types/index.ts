export interface Product {
  product_id: string;
  name: string;
  category: "sabonete" | "shampoo" | "detergente";
  sub_category: string;
  size_ml_or_g: number;
  weight_g: number;
  ph_level: number;
  fragrance: string;
  price_brl: number;
  cost_brl: number;
  sales_jan: number;
  sales_feb: number;
  sales_mar: number;
  sales_apr: number;
  sales_may: number;
  sales_jun: number;
  sales_jul: number;
  sales_aug: number;
  sales_sep: number;
  sales_oct: number;
  sales_nov: number;
  sales_dec: number;
  total_sales_2025: number;
  total_revenue_2025: number;
}

export interface CategoryForecast {
  history: number[];
  forecast: number[];
  months_history: string[];
  months_forecast: string[];
}

export interface ABCProduct {
  product_id: string;
  name: string;
  category: string;
  abc_class: "A" | "B" | "C";
  total_revenue_2025: number;
  revenue_share_pct: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  category: string;
  total_sales_2025: number;
  total_revenue_2025: number;
  price_brl: number;
}

export interface PHVsSales {
  ph_range: string;
  avg_sales: number;
}

export interface FragranceShare {
  fragrance: string;
  total_units: number;
  pct: number;
}

export interface CostBenefit {
  product_id: string;
  name: string;
  category: string;
  price_brl: number;
  weight_g: number;
  price_per_gram: number;
  total_sales_2025: number;
}

export interface Summary {
  total_products: number;
  total_revenue_2025: number;
  total_units_2025: number;
  avg_price_brl: number;
  avg_ph: number;
}

export interface Forecasts {
  summary: Summary;
  forecast_by_category: Record<string, CategoryForecast>;
  abc_classification: ABCProduct[];
  top_products: TopProduct[];
  category_revenue: Record<string, number>;
  category_units: Record<string, number>;
  category_products_count: Record<string, number>;
  ph_vs_sales: PHVsSales[];
  fragrance_share: FragranceShare[];
  cost_benefit: CostBenefit[];
}

export type ChartType =
  | "top_products"
  | "category_revenue"
  | "forecast"
  | "cost_benefit"
  | "ph_sales"
  | "fragrance"
  | "abc";

export interface QuestionConfig {
  id: number;
  text: string;
  chartType: ChartType;
  dataSliceKey: keyof Forecasts;
  description: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chartType?: ChartType;
  chartData?: unknown;
  isLoading?: boolean;
}

// ── Dashboard de produto (drill-down por SKU) ────────────────────────────────
export interface ProductListItem {
  product_id: string;
  name: string;
  category: string;
}

export interface ProductKpis {
  total_units_2025: number;
  total_revenue_2025: number;
  avg_monthly_units: number;
  best_month: string;
  best_month_units: number;
  price_brl: number;
  cost_brl: number;
  margin_pct: number;
  profit_per_unit: number;
  price_per_gram: number;
  abc_class: "A" | "B" | "C" | null;
  revenue_share_pct: number | null;
  rank_revenue: number | null;
  total_ranked: number;
  forecast_q1_2026_units: number;
  trend_pct: number | null;
}

export interface ProductMonthPoint {
  month: string;
  sales: number;
  kind: "real" | "forecast";
}

export interface ProductDetail {
  product_id: string;
  name: string;
  category: string;
  sub_category: string;
  fragrance: string;
  ph_level: number;
  size_ml_or_g: number;
}

export interface ProductAnalytics {
  product: ProductDetail;
  kpis: ProductKpis;
  series: ProductMonthPoint[];
  insight: string;
}

// ── Cérebro Corporativo (RAG sobre documentos internos) ──────────────────────
export interface CorporateChunk {
  id: string;
  source: string;
  page: number;
  text: string;
}

export interface CorporateKnowledge {
  generatedAt: string;
  sources: string[];
  chunkCount: number;
  chunks: CorporateChunk[];
}

export interface RetrievedChunk extends CorporateChunk {
  score: number;
}

export interface CorporateSourceRef {
  source: string;
  page: number;
}

export interface CorporateAnswer {
  answer: string;
  sources: CorporateSourceRef[];
}

// ── Geração de propostas comerciais (PDF) ────────────────────────────────────
export interface ProposalSection {
  heading: string;
  body: string;
}

export interface ProposalPricingItem {
  item: string;
  detail?: string;
  price: string;
}

export interface Proposal {
  title: string;
  client: string;
  date: string;
  intro: string;
  sections: ProposalSection[];
  pricing: ProposalPricingItem[];
  validity: string;
  closing: string;
  sources: string[];
}
