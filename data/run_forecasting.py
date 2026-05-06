"""
Roda modelos estatísticos nos dados YMED e gera forecasts.json.
Modelos: ARIMA(1,1,1) para previsão + ABC Classification.
"""
import json
import warnings
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

warnings.filterwarnings("ignore")

df = pd.read_csv("ymed_products.csv")

MONTHS = ["jan", "feb", "mar", "apr", "may", "jun",
          "jul", "aug", "sep", "oct", "nov", "dec"]
MONTH_LABELS = ["Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25",
                "Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25"]
FORECAST_LABELS = ["Jan/26", "Fev/26", "Mar/26"]

# ── 1. Previsão por categoria (ARIMA 1,1,1) ──────────────────────────────────
def forecast_category(df, category):
    subset = df[df["category"] == category]
    sales_cols = [f"sales_{m}" for m in MONTHS]
    monthly_total = subset[sales_cols].sum(axis=0).values.astype(float)
    try:
        model = ARIMA(monthly_total, order=(1, 1, 1))
        result = model.fit()
        forecast_values = result.forecast(steps=3)
        forecast_values = np.maximum(forecast_values, 0).round(0).astype(int).tolist()
    except Exception:
        # Fallback: média móvel simples dos últimos 3 meses
        last3 = monthly_total[-3:].mean()
        forecast_values = [int(last3)] * 3
    return {
        "history": monthly_total.round(0).astype(int).tolist(),
        "forecast": forecast_values,
        "months_history": MONTH_LABELS,
        "months_forecast": FORECAST_LABELS,
    }

forecast_by_category = {
    cat: forecast_category(df, cat)
    for cat in ["sabonete", "shampoo", "detergente"]
}

# ── 2. ABC Classification ─────────────────────────────────────────────────────
df_sorted = df.sort_values("total_revenue_2025", ascending=False).copy()
total_rev = df_sorted["total_revenue_2025"].sum()
df_sorted["cumrev"] = df_sorted["total_revenue_2025"].cumsum()
df_sorted["cum_pct"] = df_sorted["cumrev"] / total_rev * 100
df_sorted["revenue_share_pct"] = (df_sorted["total_revenue_2025"] / total_rev * 100).round(2)

def assign_abc(cum_pct):
    if cum_pct <= 70:
        return "A"
    elif cum_pct <= 90:
        return "B"
    return "C"

df_sorted["abc_class"] = df_sorted["cum_pct"].apply(assign_abc)

abc_classification = df_sorted[["product_id", "name", "category", "abc_class",
                                 "total_revenue_2025", "revenue_share_pct"]].to_dict(orient="records")

# ── 3. Top 10 produtos ────────────────────────────────────────────────────────
top_products = (
    df.nlargest(10, "total_sales_2025")
    [["product_id", "name", "category", "total_sales_2025", "total_revenue_2025", "price_brl"]]
    .to_dict(orient="records")
)

# ── 4. Receita por categoria ──────────────────────────────────────────────────
category_revenue = (
    df.groupby("category")["total_revenue_2025"]
    .sum()
    .round(2)
    .to_dict()
)
category_units = (
    df.groupby("category")["total_sales_2025"]
    .sum()
    .to_dict()
)
category_products_count = df.groupby("category").size().to_dict()

# ── 5. pH vs Vendas (médias por faixa de pH) ─────────────────────────────────
bins = [4.0, 5.0, 6.0, 7.0, 8.0, 9.5]
labels_ph = ["4.0–5.0", "5.0–6.0", "6.0–7.0", "7.0–8.0", "8.0–9.5"]
df["ph_range"] = pd.cut(df["ph_level"], bins=bins, labels=labels_ph, right=True)
ph_vs_sales = (
    df.groupby("ph_range", observed=True)["total_sales_2025"]
    .mean()
    .round(0)
    .reset_index()
    .rename(columns={"ph_range": "ph_range", "total_sales_2025": "avg_sales"})
)
ph_vs_sales["avg_sales"] = ph_vs_sales["avg_sales"].astype(int)
ph_vs_sales_list = ph_vs_sales.to_dict(orient="records")

# ── 6. Essências mais populares ───────────────────────────────────────────────
fragrance_sales = (
    df.groupby("fragrance")["total_sales_2025"]
    .sum()
    .reset_index()
)
fragrance_sales["pct"] = (
    fragrance_sales["total_sales_2025"] / fragrance_sales["total_sales_2025"].sum() * 100
).round(1)
fragrance_sales = fragrance_sales.sort_values("pct", ascending=False)
fragrance_share = fragrance_sales.rename(
    columns={"total_sales_2025": "total_units"}
).to_dict(orient="records")

# ── 7. Custo-benefício (preço / gramatura) ────────────────────────────────────
df["price_per_gram"] = (df["price_brl"] / df["weight_g"]).round(4)
cost_benefit = (
    df[["product_id", "name", "category", "price_brl", "weight_g", "price_per_gram", "total_sales_2025"]]
    .sort_values("price_per_gram")
    .to_dict(orient="records")
)

# ── 8. Summary stats ──────────────────────────────────────────────────────────
summary = {
    "total_products": len(df),
    "total_revenue_2025": round(df["total_revenue_2025"].sum(), 2),
    "total_units_2025": int(df["total_sales_2025"].sum()),
    "avg_price_brl": round(df["price_brl"].mean(), 2),
    "avg_ph": round(df["ph_level"].mean(), 2),
}

# ── Montar JSON final ─────────────────────────────────────────────────────────
output = {
    "summary": summary,
    "forecast_by_category": forecast_by_category,
    "abc_classification": abc_classification,
    "top_products": top_products,
    "category_revenue": category_revenue,
    "category_units": category_units,
    "category_products_count": category_products_count,
    "ph_vs_sales": ph_vs_sales_list,
    "fragrance_share": fragrance_share,
    "cost_benefit": cost_benefit,
}

with open("forecasts.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("forecasts.json gerado com sucesso!")
print(f"Receita total: R$ {summary['total_revenue_2025']:,.2f}")
print(f"Unidades totais: {summary['total_units_2025']:,}")
print("\nDistribuição ABC:")
print(df_sorted.groupby("abc_class")["product_id"].count().to_string())
print("\nTop 3 produtos:")
for p in top_products[:3]:
    print(f"  {p['name']}: {p['total_sales_2025']:,} unidades")
