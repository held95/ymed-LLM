"""
Gera o dataset sintético realista de produtos YMED.
Saída: ymed_products.csv (~50 produtos)
"""
import numpy as np
import pandas as pd

np.random.seed(42)

FRAGRANCES = ["Lavanda", "Rosa", "Coco", "Hortelã", "Camomila", "Sem Perfume", "Erva-Doce", "Aloe Vera"]

PRODUCTS = [
    # Sabonetes (20 produtos)
    {"name": "YMED Lavanda Hidratante 90g",       "category": "sabonete", "sub_category": "hidratante",  "size": 90,  "weight_g": 90,  "ph": 5.5, "fragrance": "Lavanda",      "price": 4.50,  "cost": 1.80},
    {"name": "YMED Rosa Suave 90g",               "category": "sabonete", "sub_category": "suave",       "size": 90,  "weight_g": 90,  "ph": 5.8, "fragrance": "Rosa",          "price": 4.20,  "cost": 1.70},
    {"name": "YMED Coco Nutritivo 150g",          "category": "sabonete", "sub_category": "nutritivo",   "size": 150, "weight_g": 150, "ph": 5.2, "fragrance": "Coco",          "price": 6.90,  "cost": 2.80},
    {"name": "YMED Antibacteriano Hortelã 90g",   "category": "sabonete", "sub_category": "antibacteriano","size": 90, "weight_g": 90,  "ph": 6.0, "fragrance": "Hortelã",       "price": 5.50,  "cost": 2.20},
    {"name": "YMED Camomila Suave 200g",          "category": "sabonete", "sub_category": "suave",       "size": 200, "weight_g": 200, "ph": 5.6, "fragrance": "Camomila",      "price": 9.90,  "cost": 4.00},
    {"name": "YMED Neutro Sem Perfume 90g",       "category": "sabonete", "sub_category": "neutro",      "size": 90,  "weight_g": 90,  "ph": 5.0, "fragrance": "Sem Perfume",   "price": 3.80,  "cost": 1.50},
    {"name": "YMED Erva-Doce Premium 150g",       "category": "sabonete", "sub_category": "premium",     "size": 150, "weight_g": 150, "ph": 5.4, "fragrance": "Erva-Doce",    "price": 8.50,  "cost": 3.40},
    {"name": "YMED Aloe Vera Refrescante 90g",    "category": "sabonete", "sub_category": "hidratante",  "size": 90,  "weight_g": 90,  "ph": 5.7, "fragrance": "Aloe Vera",     "price": 5.20,  "cost": 2.10},
    {"name": "YMED Lavanda Premium 200g",         "category": "sabonete", "sub_category": "premium",     "size": 200, "weight_g": 200, "ph": 5.5, "fragrance": "Lavanda",       "price": 12.90, "cost": 5.20},
    {"name": "YMED Rosa Pétala 150g",             "category": "sabonete", "sub_category": "hidratante",  "size": 150, "weight_g": 150, "ph": 5.9, "fragrance": "Rosa",          "price": 7.90,  "cost": 3.20},
    {"name": "YMED Coco Antibacteriano 90g",      "category": "sabonete", "sub_category": "antibacteriano","size": 90, "weight_g": 90,  "ph": 6.2, "fragrance": "Coco",          "price": 5.80,  "cost": 2.30},
    {"name": "YMED Neutro Sensitivo 200g",        "category": "sabonete", "sub_category": "neutro",      "size": 200, "weight_g": 200, "ph": 5.0, "fragrance": "Sem Perfume",   "price": 10.50, "cost": 4.20},
    {"name": "YMED Hortelã Sport 90g",            "category": "sabonete", "sub_category": "sport",       "size": 90,  "weight_g": 90,  "ph": 6.0, "fragrance": "Hortelã",       "price": 5.90,  "cost": 2.40},
    {"name": "YMED Camomila Bebê 80g",            "category": "sabonete", "sub_category": "bebê",        "size": 80,  "weight_g": 80,  "ph": 5.5, "fragrance": "Camomila",      "price": 7.20,  "cost": 2.90},
    {"name": "YMED Erva-Doce Suave 90g",          "category": "sabonete", "sub_category": "suave",       "size": 90,  "weight_g": 90,  "ph": 5.3, "fragrance": "Erva-Doce",    "price": 4.90,  "cost": 2.00},
    {"name": "YMED Aloe Vera Premium 200g",       "category": "sabonete", "sub_category": "premium",     "size": 200, "weight_g": 200, "ph": 5.8, "fragrance": "Aloe Vera",     "price": 14.90, "cost": 6.00},
    {"name": "YMED Lavanda Antibacteriano 90g",   "category": "sabonete", "sub_category": "antibacteriano","size": 90, "weight_g": 90,  "ph": 6.1, "fragrance": "Lavanda",       "price": 5.40,  "cost": 2.20},
    {"name": "YMED Rosa Premium 150g",            "category": "sabonete", "sub_category": "premium",     "size": 150, "weight_g": 150, "ph": 5.7, "fragrance": "Rosa",          "price": 9.50,  "cost": 3.80},
    {"name": "YMED Coco Hidratante 200g",         "category": "sabonete", "sub_category": "hidratante",  "size": 200, "weight_g": 200, "ph": 5.3, "fragrance": "Coco",          "price": 11.90, "cost": 4.80},
    {"name": "YMED Neutro pH5 Bebê 80g",          "category": "sabonete", "sub_category": "bebê",        "size": 80,  "weight_g": 80,  "ph": 5.0, "fragrance": "Sem Perfume",   "price": 6.50,  "cost": 2.60},

    # Shampoos (18 produtos)
    {"name": "YMED Lavanda Hidratação 300ml",     "category": "shampoo",  "sub_category": "hidratante",  "size": 300, "weight_g": 310, "ph": 5.0, "fragrance": "Lavanda",       "price": 14.90, "cost": 6.00},
    {"name": "YMED Anticaspa Hortelã 400ml",      "category": "shampoo",  "sub_category": "anticaspa",   "size": 400, "weight_g": 415, "ph": 5.5, "fragrance": "Hortelã",       "price": 18.90, "cost": 7.60},
    {"name": "YMED Coco Nutrição 300ml",          "category": "shampoo",  "sub_category": "nutritivo",   "size": 300, "weight_g": 310, "ph": 4.8, "fragrance": "Coco",          "price": 15.90, "cost": 6.40},
    {"name": "YMED Sem Sal Aloe Vera 250ml",      "category": "shampoo",  "sub_category": "sem sal",     "size": 250, "weight_g": 260, "ph": 5.2, "fragrance": "Aloe Vera",     "price": 22.90, "cost": 9.20},
    {"name": "YMED Camomila Suave 300ml",         "category": "shampoo",  "sub_category": "suave",       "size": 300, "weight_g": 310, "ph": 5.0, "fragrance": "Camomila",      "price": 13.90, "cost": 5.60},
    {"name": "YMED Rosa Brilho 400ml",            "category": "shampoo",  "sub_category": "brilho",      "size": 400, "weight_g": 415, "ph": 4.9, "fragrance": "Rosa",          "price": 17.90, "cost": 7.20},
    {"name": "YMED Neutro Sensitivo 200ml",       "category": "shampoo",  "sub_category": "neutro",      "size": 200, "weight_g": 210, "ph": 5.5, "fragrance": "Sem Perfume",   "price": 12.90, "cost": 5.20},
    {"name": "YMED Anticaspa Intensivo 400ml",    "category": "shampoo",  "sub_category": "anticaspa",   "size": 400, "weight_g": 415, "ph": 5.8, "fragrance": "Hortelã",       "price": 24.90, "cost": 10.00},
    {"name": "YMED Erva-Doce Volume 300ml",       "category": "shampoo",  "sub_category": "volume",      "size": 300, "weight_g": 310, "ph": 5.0, "fragrance": "Erva-Doce",    "price": 16.90, "cost": 6.80},
    {"name": "YMED Coco Premium 400ml",           "category": "shampoo",  "sub_category": "premium",     "size": 400, "weight_g": 415, "ph": 4.7, "fragrance": "Coco",          "price": 24.90, "cost": 10.00},
    {"name": "YMED Lavanda Reconstrução 300ml",   "category": "shampoo",  "sub_category": "reconstrução", "size": 300, "weight_g": 310, "ph": 5.1, "fragrance": "Lavanda",       "price": 19.90, "cost": 8.00},
    {"name": "YMED Aloe Vera Hidratação 250ml",   "category": "shampoo",  "sub_category": "hidratante",  "size": 250, "weight_g": 260, "ph": 5.2, "fragrance": "Aloe Vera",     "price": 18.90, "cost": 7.60},
    {"name": "YMED Rosa Premium Brilho 400ml",    "category": "shampoo",  "sub_category": "premium",     "size": 400, "weight_g": 415, "ph": 4.9, "fragrance": "Rosa",          "price": 22.90, "cost": 9.20},
    {"name": "YMED Bebê Camomila 200ml",          "category": "shampoo",  "sub_category": "bebê",        "size": 200, "weight_g": 210, "ph": 5.5, "fragrance": "Camomila",      "price": 15.90, "cost": 6.40},
    {"name": "YMED Sem Sal Lavanda 250ml",        "category": "shampoo",  "sub_category": "sem sal",     "size": 250, "weight_g": 260, "ph": 5.0, "fragrance": "Lavanda",       "price": 20.90, "cost": 8.40},
    {"name": "YMED Hortelã Sport 400ml",          "category": "shampoo",  "sub_category": "sport",       "size": 400, "weight_g": 415, "ph": 5.5, "fragrance": "Hortelã",       "price": 16.90, "cost": 6.80},
    {"name": "YMED Coco Suave 300ml",             "category": "shampoo",  "sub_category": "suave",       "size": 300, "weight_g": 310, "ph": 5.0, "fragrance": "Coco",          "price": 14.90, "cost": 6.00},
    {"name": "YMED Neutro Bebê 200ml",            "category": "shampoo",  "sub_category": "bebê",        "size": 200, "weight_g": 210, "ph": 5.5, "fragrance": "Sem Perfume",   "price": 14.90, "cost": 6.00},

    # Detergentes (12 produtos)
    {"name": "YMED Neutro 500ml",                 "category": "detergente", "sub_category": "neutro",    "size": 500, "weight_g": 520, "ph": 7.0, "fragrance": "Sem Perfume",   "price": 5.90,  "cost": 2.40},
    {"name": "YMED Limão 500ml",                  "category": "detergente", "sub_category": "desengordurante","size": 500,"weight_g": 520, "ph": 7.5,"fragrance": "Limão",       "price": 6.20,  "cost": 2.50},
    {"name": "YMED Coco Biodegradável 500ml",     "category": "detergente", "sub_category": "biodegradável","size": 500,"weight_g": 520, "ph": 7.2,"fragrance": "Coco",          "price": 7.90,  "cost": 3.20},
    {"name": "YMED Limão Concentrado 1000ml",     "category": "detergente", "sub_category": "concentrado","size": 1000,"weight_g": 1040,"ph": 7.8,"fragrance": "Limão",          "price": 10.90, "cost": 4.40},
    {"name": "YMED Antibacteriano 500ml",         "category": "detergente", "sub_category": "antibacteriano","size": 500,"weight_g": 520,"ph": 8.0,"fragrance": "Sem Perfume",   "price": 7.50,  "cost": 3.00},
    {"name": "YMED Neutro Concentrado 1000ml",    "category": "detergente", "sub_category": "concentrado","size": 1000,"weight_g": 1040,"ph": 7.0,"fragrance": "Sem Perfume",    "price": 9.90,  "cost": 4.00},
    {"name": "YMED Lavanda 500ml",                "category": "detergente", "sub_category": "suave",     "size": 500, "weight_g": 520, "ph": 7.3, "fragrance": "Lavanda",       "price": 6.80,  "cost": 2.70},
    {"name": "YMED Limão Premium 1000ml",         "category": "detergente", "sub_category": "premium",   "size": 1000,"weight_g": 1040,"ph": 7.5, "fragrance": "Limão",         "price": 12.90, "cost": 5.20},
    {"name": "YMED Coco 500ml",                   "category": "detergente", "sub_category": "suave",     "size": 500, "weight_g": 520, "ph": 7.2, "fragrance": "Coco",          "price": 6.50,  "cost": 2.60},
    {"name": "YMED Antibacteriano Limão 1000ml",  "category": "detergente", "sub_category": "antibacteriano","size": 1000,"weight_g": 1040,"ph": 8.2,"fragrance": "Limão",       "price": 11.90, "cost": 4.80},
    {"name": "YMED Biodegradável Lavanda 500ml",  "category": "detergente", "sub_category": "biodegradável","size": 500,"weight_g": 520,"ph": 7.1,"fragrance": "Lavanda",         "price": 8.50,  "cost": 3.40},
    {"name": "YMED Neutro Bebê 500ml",            "category": "detergente", "sub_category": "bebê",      "size": 500, "weight_g": 520, "ph": 7.0, "fragrance": "Sem Perfume",   "price": 8.90,  "cost": 3.60},
]

# Sazonalidade: pico em dezembro e junho (festas + inverno)
def seasonal_sales(base, category):
    months = np.arange(12)
    # Onda senoidal com pico em mês 11 (dez) e 5 (jun)
    seasonality = 1 + 0.25 * np.sin(2 * np.pi * (months - 5) / 12)
    if category == "sabonete":
        seasonality *= np.array([0.9, 0.85, 0.9, 0.95, 1.0, 1.1, 1.05, 1.0, 0.95, 1.0, 1.1, 1.3])
    elif category == "shampoo":
        seasonality *= np.array([0.95, 0.9, 0.95, 1.0, 1.05, 1.1, 1.0, 1.0, 1.0, 1.05, 1.1, 1.2])
    else:  # detergente
        seasonality *= np.array([1.1, 1.0, 0.95, 0.9, 0.95, 1.0, 1.05, 1.0, 0.95, 1.0, 1.05, 1.1])
    noise = np.random.normal(1.0, 0.05, 12)
    raw = (base * seasonality * noise).astype(int)
    return np.maximum(raw, 10)

# Base de vendas por categoria e sub-categoria
BASE_SALES = {
    "sabonete": {"hidratante": 800, "suave": 900, "nutritivo": 600, "antibacteriano": 700,
                 "neutro": 500, "premium": 400, "sport": 550, "bebê": 450},
    "shampoo":  {"hidratante": 500, "anticaspa": 600, "nutritivo": 450, "sem sal": 350,
                 "suave": 480, "brilho": 420, "neutro": 380, "volume": 400,
                 "reconstrução": 360, "premium": 300, "bebê": 320, "sport": 400},
    "detergente": {"neutro": 1200, "desengordurante": 1100, "biodegradável": 700,
                   "concentrado": 800, "antibacteriano": 900, "suave": 750, "premium": 550, "bebê": 600},
}

rows = []
for i, p in enumerate(PRODUCTS, 1):
    pid = f"P{i:03d}"
    sub = p["sub_category"]
    base = BASE_SALES[p["category"]].get(sub, 500)
    # Pequena variação por produto
    base = int(base * np.random.uniform(0.8, 1.2))
    monthly = seasonal_sales(base, p["category"])

    row = {
        "product_id": pid,
        "name": p["name"],
        "category": p["category"],
        "sub_category": p["sub_category"],
        "size_ml_or_g": p["size"],
        "weight_g": p["weight_g"],
        "ph_level": round(p["ph"] + np.random.uniform(-0.1, 0.1), 1),
        "fragrance": p["fragrance"],
        "price_brl": p["price"],
        "cost_brl": p["cost"],
    }
    months = ["jan", "feb", "mar", "apr", "may", "jun",
              "jul", "aug", "sep", "oct", "nov", "dec"]
    for m, val in zip(months, monthly):
        row[f"sales_{m}"] = int(val)

    row["total_sales_2025"] = int(monthly.sum())
    row["total_revenue_2025"] = round(row["total_sales_2025"] * p["price"], 2)
    rows.append(row)

df = pd.DataFrame(rows)
output_path = "ymed_products.csv"
df.to_csv(output_path, index=False)
print(f"Dataset gerado: {output_path} ({len(df)} produtos)")
print(df.groupby("category")["total_revenue_2025"].sum().to_string())
