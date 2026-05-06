import { QuestionConfig } from "@/types";

export const QUESTIONS: QuestionConfig[] = [
  {
    id: 1,
    text: "Quais são os produtos mais vendidos da YMED?",
    chartType: "top_products",
    dataSliceKey: "top_products",
    description: "Top 10 produtos por volume de unidades vendidas em 2025",
  },
  {
    id: 2,
    text: "Qual categoria gera mais receita?",
    chartType: "category_revenue",
    dataSliceKey: "category_revenue",
    description: "Comparativo de receita entre sabonetes, shampoos e detergentes",
  },
  {
    id: 3,
    text: "Qual a previsão de vendas para os próximos 3 meses?",
    chartType: "forecast",
    dataSliceKey: "forecast_by_category",
    description: "Previsão ARIMA(1,1,1) para Jan–Mar 2026 por categoria",
  },
  {
    id: 4,
    text: "Quais produtos têm melhor custo-benefício?",
    chartType: "cost_benefit",
    dataSliceKey: "cost_benefit",
    description: "Relação preço por grama — quanto menor, melhor para o consumidor",
  },
  {
    id: 5,
    text: "O pH dos produtos influencia as vendas?",
    chartType: "ph_sales",
    dataSliceKey: "ph_vs_sales",
    description: "Média de vendas por faixa de pH",
  },
  {
    id: 6,
    text: "Quais essências são mais populares?",
    chartType: "fragrance",
    dataSliceKey: "fragrance_share",
    description: "Participação percentual de cada essência/fragrância nas vendas totais",
  },
  {
    id: 7,
    text: "Como os produtos se classificam por performance (ABC)?",
    chartType: "abc",
    dataSliceKey: "abc_classification",
    description: "Classificação ABC: A=top 70% receita, B=70–90%, C=restante",
  },
];
