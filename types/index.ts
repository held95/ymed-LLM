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
