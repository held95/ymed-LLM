# YMED Analytics

Chatbot de análise de vendas para a YMED, marca fictícia de produtos de higiene e limpeza. Powered by Claude AI (Anthropic).

## Funcionalidades

- 7 perguntas sugeridas fixas com respostas baseadas em dados reais
- Gráficos interativos (Recharts) para cada resposta
- Modelos estatísticos pré-computados (ARIMA + classificação ABC)
- Zero alucinações — Claude responde apenas com dados do dataset

## Stack

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind CSS
- **Charts:** Recharts
- **LLM:** Anthropic Claude (`claude-haiku-4-5-20251001`)
- **Deploy:** Vercel

## Configuração local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/ymed-ai-analytics
cd ymed-ai-analytics

# 2. Instale as dependências
npm install

# 3. Configure a chave de API
cp .env.example .env.local
# Edite .env.local e adicione sua ANTHROPIC_API_KEY

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Deploy na Vercel

1. Suba o repositório no GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Adicione a variável de ambiente `ANTHROPIC_API_KEY` no painel da Vercel
4. Deploy automático via push no branch `main`

## Regenerar os dados (opcional)

Os dados já estão commitados em `public/`. Para regenerar:

```bash
cd data
pip install pandas numpy statsmodels
python generate_dataset.py
python run_forecasting.py
cp ymed_products.csv ../public/
cp forecasts.json ../public/
```

## As 7 Perguntas

| # | Pergunta | Gráfico |
|---|---|---|
| 1 | Quais são os produtos mais vendidos? | Barras horizontal |
| 2 | Qual categoria gera mais receita? | Pizza |
| 3 | Previsão de vendas para 3 meses? | Linha + previsão |
| 4 | Melhor custo-benefício? | Dispersão |
| 5 | pH influencia as vendas? | Barras por faixa |
| 6 | Essências mais populares? | Pizza |
| 7 | Classificação ABC de performance? | Barras coloridas |
