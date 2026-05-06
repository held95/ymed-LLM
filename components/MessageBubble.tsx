"use client";
import { Message, ChartType, TopProduct, CategoryForecast, CostBenefit, PHVsSales, FragranceShare, ABCProduct } from "@/types";
import dynamic from "next/dynamic";

const TopProductsChart = dynamic(() => import("./charts/TopProductsChart"), { ssr: false });
const CategoryRevenueChart = dynamic(() => import("./charts/CategoryRevenueChart"), { ssr: false });
const ForecastLineChart = dynamic(() => import("./charts/ForecastLineChart"), { ssr: false });
const CostBenefitChart = dynamic(() => import("./charts/CostBenefitChart"), { ssr: false });
const PHSalesChart = dynamic(() => import("./charts/PHSalesChart"), { ssr: false });
const FragranceChart = dynamic(() => import("./charts/FragranceChart"), { ssr: false });
const ABCChart = dynamic(() => import("./charts/ABCChart"), { ssr: false });

function renderChart(chartType: ChartType, chartData: unknown) {
  switch (chartType) {
    case "top_products":
      return <TopProductsChart data={chartData as TopProduct[]} />;
    case "category_revenue":
      return <CategoryRevenueChart data={chartData as Record<string, number>} />;
    case "forecast":
      return <ForecastLineChart data={chartData as Record<string, CategoryForecast>} />;
    case "cost_benefit":
      return <CostBenefitChart data={chartData as CostBenefit[]} />;
    case "ph_sales":
      return <PHSalesChart data={chartData as PHVsSales[]} />;
    case "fragrance":
      return <FragranceChart data={chartData as FragranceShare[]} />;
    case "abc":
      return <ABCChart data={chartData as ABCProduct[]} />;
    default:
      return null;
  }
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-green-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[92%] w-full">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Y</span>
          </div>
          <span className="text-xs text-gray-500 font-medium">YMED Analytics</span>
        </div>

        {message.isLoading ? (
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <div className="flex gap-1 items-center h-5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm space-y-3">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            {message.chartType && message.chartData != null && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {renderChart(message.chartType, message.chartData)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
