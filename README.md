# YMED Analytics

Plataforma de inteligência de vendas para a YMED, marca fictícia de produtos de higiene e limpeza (sabonetes, shampoos e detergentes). Powered by Claude AI (Anthropic), LangChain e LangGraph.

## Funcionalidades (3 abas)

1. **Chat Analytics** (`/`) — 7 perguntas sugeridas com respostas baseadas em dados reais e gráficos interativos (Recharts). Slices estatísticos pré-computados (tendência linear + classificação ABC).
2. **Produtos YMED** (`/products-analytics`) — dashboard drill-down por SKU: busca de produto, KPIs (receita, unidades, margem, classe ABC, ranking, tendência), evolução mensal + previsão e análise da IA.
3. **Cérebro Corporativo** (`/corporate-brain`) — RAG sobre documentos internos (PDFs + Excel): perguntas respondidas **somente** com base nos arquivos, com citação de fonte; e **geração de propostas comerciais em PDF** a partir da política comercial e da tabela de preços internas.

Zero alucinações — o LLM responde apenas com os dados fornecidos. Sem chave de API, o app continua navegável e os recursos de IA degradam graciosamente.

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind v4
- **Charts:** Recharts · **PDF (cliente):** jsPDF
- **LLM:** Anthropic Claude (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk` (dashboards) e `@langchain/anthropic` (Cérebro Corporativo)
- **RAG/orquestração:** LangChain (`@langchain/textsplitters`) + LangGraph (`@langchain/langgraph`)
- **Retrieval:** TF-IDF leve em memória (sem vector DB, sem embeddings em runtime → sem travamentos)
- **Dados:** CSV/JSON pré-computados, pipeline em Node

## Configuração local

```bash
npm install
cp .env.example .env.local   # adicione sua ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

## Arquitetura de dados

```
data/generate_dataset.mjs   → public/ymed_products.csv     (catálogo: 180 SKUs)
data/build_analytics.mjs    → public/forecasts.json        (slices do chat: ABC, top, etc.)
data/generate_corporate_docs.mjs → data/corporate/*.pdf|.xlsx   (docs internos da demo)
data/ingest_corporate.mjs   → public/corporate-knowledge.json   (chunks p/ RAG)
```

- `lib/data.ts` (forecasts.json), `lib/products.ts` (CSV via papaparse) e `lib/corporate.ts` (knowledge.json) leem os arquivos uma vez e mantêm cache de módulo.
- `lib/corporate-graph.ts` define os grafos **LangGraph** (Q&A e proposta) com `ChatAnthropic`.

### Regenerar os dados

Tudo já está commitado em `public/`. Para regenerar (somente Node, **não requer Python**):

```bash
npm run data:all     # gera dataset + analytics + docs internos + índice RAG
npm run test:corporate   # teste offline do retrieval (não precisa de API key)
```

> Os scripts Python legados (`data/generate_dataset.py`, `data/run_forecasting.py`) permanecem como referência, mas o pipeline ativo é o de Node acima — ele não depende de `pandas`/`statsmodels` e gera um catálogo maior (180 SKUs).

## Verificação

```bash
npx tsc --noEmit     # checagem de tipos (de-facto check do projeto)
npm run build        # build de produção
npm run test:corporate
```

## Deploy na Vercel

1. Suba o repositório no GitHub e importe na [Vercel](https://vercel.com).
2. Adicione `ANTHROPIC_API_KEY` (e, opcionalmente, `CORPORATE_MODEL`) nas variáveis de ambiente.
3. Deploy automático via push no branch principal.

## As 7 perguntas (Chat Analytics)

| # | Pergunta | Gráfico |
|---|---|---|
| 1 | Produtos mais vendidos | Barras horizontal |
| 2 | Categoria que gera mais receita | Pizza |
| 3 | Previsão de vendas (3 meses) | Linha + previsão |
| 4 | Melhor custo-benefício | Dispersão |
| 5 | pH influencia as vendas? | Barras por faixa |
| 6 | Essências mais populares | Pizza |
| 7 | Classificação ABC | Barras coloridas |
