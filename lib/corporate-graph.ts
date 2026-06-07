import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { retrieve } from "./corporate";
import { getProducts } from "./products";
import {
  CorporateAnswer,
  CorporateSourceRef,
  Proposal,
  ProposalPricingItem,
  ProposalSection,
  RetrievedChunk,
} from "@/types";

/**
 * Orquestração do Cérebro Corporativo com LangGraph + ChatAnthropic (Claude).
 * Dois fluxos: (1) perguntas e respostas aterradas nos documentos internos;
 * (2) redação de propostas comerciais. O retrieval é leve/local (lib/corporate),
 * então o grafo só faz I/O de modelo — sem travamentos.
 */

const MODEL_ID = process.env.CORPORATE_MODEL || "claude-haiku-4-5-20251001";

function getModel(maxTokens = 700) {
  return new ChatAnthropic({ model: MODEL_ID, temperature: 0.1, maxTokens });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => (typeof c === "string" ? c : c?.text ?? "")).join("");
  }
  return String(content ?? "");
}

function dedupeSources(chunks: RetrievedChunk[]): CorporateSourceRef[] {
  const seen = new Set<string>();
  const out: CorporateSourceRef[] = [];
  for (const c of chunks) {
    const key = `${c.source}#${c.page}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ source: c.source, page: c.page });
    }
  }
  return out;
}

const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── Fluxo 1: Q&A aterrado ─────────────────────────────────────────────────────
const BRAIN_SYSTEM = `Você é o "Cérebro Corporativo" da YMED, indústria de produtos de higiene e limpeza.
REGRAS:
1. Responda APENAS com base nos TRECHOS dos documentos internos fornecidos. Nunca invente.
2. Cite a(s) fonte(s) ao final entre colchetes, ex.: [Política Comercial].
3. Se a resposta não estiver nos trechos, diga claramente que não encontrou a informação nos documentos internos.
4. Português brasileiro, objetivo, no máximo 2 parágrafos curtos. Cite números concretos quando houver.`;

const BrainState = Annotation.Root({
  question: Annotation<string>(),
  context: Annotation<RetrievedChunk[]>(),
  answer: Annotation<string>(),
  sources: Annotation<CorporateSourceRef[]>(),
});

async function brainRetrieve(s: typeof BrainState.State) {
  return { context: retrieve(s.question, 4) };
}

async function brainAnswer(s: typeof BrainState.State) {
  const ctx = s.context ?? [];
  if (ctx.length === 0) {
    return {
      answer:
        "Não encontrei essa informação nos documentos internos disponíveis (Política Comercial, Catálogo de Produtos, FAQ Interno e Tabela de Preços). Tente reformular a pergunta.",
      sources: [],
    };
  }
  const blocks = ctx.map((c) => `[Fonte: ${c.source}]\n${c.text}`).join("\n\n---\n\n");
  const model = getModel(600);
  const res = await model.invoke([
    { role: "system", content: BRAIN_SYSTEM },
    {
      role: "user",
      content: `PERGUNTA: ${s.question}\n\nTRECHOS DOS DOCUMENTOS INTERNOS:\n${blocks}`,
    },
  ]);
  return { answer: asText(res.content).trim(), sources: dedupeSources(ctx) };
}

let _brain: ReturnType<typeof compileBrain> | null = null;
function compileBrain() {
  // Obs.: nomes de nós não podem colidir com nomes de canais do estado
  // (ex.: "answer"/"context"); por isso os nós têm sufixo "_step".
  return new StateGraph(BrainState)
    .addNode("retrieve_step", brainRetrieve)
    .addNode("answer_step", brainAnswer)
    .addEdge(START, "retrieve_step")
    .addEdge("retrieve_step", "answer_step")
    .addEdge("answer_step", END)
    .compile();
}
function brainGraph() {
  if (!_brain) _brain = compileBrain();
  return _brain;
}

export async function askCorporateBrain(question: string): Promise<CorporateAnswer> {
  const out = await brainGraph().invoke({ question });
  return { answer: out.answer, sources: out.sources ?? [] };
}

// ── Fluxo 2: redação de proposta ──────────────────────────────────────────────
interface SelProduct {
  product_id: string;
  name: string;
  category: string;
  price_brl: number;
  distributor_brl: number;
}

const ProposalState = Annotation.Root({
  clientName: Annotation<string>(),
  productIds: Annotation<string[]>(),
  notes: Annotation<string>(),
  context: Annotation<RetrievedChunk[]>(),
  products: Annotation<SelProduct[]>(),
  proposal: Annotation<Proposal>(),
});

async function proposalRetrieve(s: typeof ProposalState.State) {
  const query = `${s.notes ?? ""} política comercial desconto por volume preço distribuidor prazo de entrega condições de pagamento pedido mínimo`;
  return { context: retrieve(query, 5) };
}

async function proposalGather(s: typeof ProposalState.State) {
  const all = getProducts();
  const products: SelProduct[] = (s.productIds ?? [])
    .map((id) => all.find((p) => p.product_id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      price_brl: Number(p.price_brl),
      distributor_brl: Math.round(Number(p.price_brl) * 0.82 * 100) / 100,
    }));
  return { products };
}

function fallbackProposal(s: typeof ProposalState.State): Proposal {
  const products = s.products ?? [];
  const pricing: ProposalPricingItem[] = products.map((p) => ({
    item: p.name,
    detail: `${p.category} · preço de distribuidor`,
    price: brl(p.distributor_brl),
  }));
  const sections: ProposalSection[] = [
    {
      heading: "Condições comerciais",
      body: "Descontos por volume conforme política vigente: 8% (100–299 caixas), 12% (300–499), 18% (500–999) e 25% acima de 1000 caixas. Pagamento à vista garante 3% adicionais. Pedido mínimo de 50 caixas.",
    },
    {
      heading: "Logística",
      body: "Frete CIF para pedidos acima de 300 caixas. Prazos: Sudeste 3–5 dias úteis; Sul/Centro-Oeste 5–8; Nordeste 7–10; Norte 10–15.",
    },
  ];
  return {
    title: `Proposta Comercial YMED — ${s.clientName || "Cliente"}`,
    client: s.clientName || "Cliente",
    date: new Date().toLocaleDateString("pt-BR"),
    intro: `Prezados, apresentamos a proposta comercial da YMED${products.length ? ` para a linha selecionada (${products.length} itens)` : ""}, com condições baseadas em nossa política comercial vigente.`,
    sections,
    pricing,
    validity: "Proposta válida por 30 dias.",
    closing: "Ficamos à disposição para ajustar volumes e condições. Atenciosamente, Equipe Comercial YMED.",
    sources: dedupeSources(s.context ?? []).map((x) => x.source),
  };
}

async function proposalDraft(s: typeof ProposalState.State): Promise<{ proposal: Proposal }> {
  const products = s.products ?? [];
  const ctx = s.context ?? [];
  if (!process.env.ANTHROPIC_API_KEY) {
    return { proposal: fallbackProposal(s) };
  }
  try {
    const policyBlocks = ctx.map((c) => `[${c.source}] ${c.text}`).join("\n\n");
    const productLines = products
      .map((p) => `- ${p.name} (${p.category}): varejo ${brl(p.price_brl)}, distribuidor ${brl(p.distributor_brl)}`)
      .join("\n");
    const model = getModel(1100);
    const res = await model.invoke([
      {
        role: "system",
        content: `Você é redator comercial da YMED. Gere uma PROPOSTA COMERCIAL para um cliente B2B, em português, usando SOMENTE as condições da política e os produtos fornecidos (não invente preços nem regras). Responda ESTRITAMENTE em JSON válido, sem markdown, no formato:
{"intro": string, "sections": [{"heading": string, "body": string}], "pricing": [{"item": string, "detail": string, "price": string}], "validity": string, "closing": string}
- "sections": 2 a 4 seções (ex.: condições comerciais, descontos por volume, logística/prazos, próximos passos).
- "pricing": uma linha por produto fornecido, com o preço de distribuidor.
- Use os descontos por volume e prazos exatamente como na política.`,
      },
      {
        role: "user",
        content: `CLIENTE: ${s.clientName || "Cliente"}
OBSERVAÇÕES DO VENDEDOR: ${s.notes || "(nenhuma)"}

PRODUTOS SELECIONADOS:
${productLines || "(nenhum produto específico — proposta institucional)"}

TRECHOS DA POLÍTICA/TABELA INTERNA:
${policyBlocks || "(sem trechos)"}`,
      },
    ]);
    const raw = asText(res.content).trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(raw);
    const proposal: Proposal = {
      title: `Proposta Comercial YMED — ${s.clientName || "Cliente"}`,
      client: s.clientName || "Cliente",
      date: new Date().toLocaleDateString("pt-BR"),
      intro: String(parsed.intro ?? ""),
      sections: Array.isArray(parsed.sections) ? parsed.sections.slice(0, 5) : [],
      pricing: Array.isArray(parsed.pricing) ? parsed.pricing : [],
      validity: String(parsed.validity ?? "Proposta válida por 30 dias."),
      closing: String(parsed.closing ?? "Atenciosamente, Equipe Comercial YMED."),
      sources: dedupeSources(ctx).map((x) => x.source),
    };
    // Garante que sempre haja pricing quando há produtos selecionados.
    if (proposal.pricing.length === 0 && products.length > 0) {
      proposal.pricing = products.map((p) => ({
        item: p.name,
        detail: `${p.category} · preço de distribuidor`,
        price: brl(p.distributor_brl),
      }));
    }
    return { proposal };
  } catch (err) {
    console.error("[corporate-graph] proposalDraft fallback:", err);
    return { proposal: fallbackProposal(s) };
  }
}

let _proposal: ReturnType<typeof compileProposal> | null = null;
function compileProposal() {
  return new StateGraph(ProposalState)
    .addNode("retrieve_step", proposalRetrieve)
    .addNode("gather_step", proposalGather)
    .addNode("draft_step", proposalDraft)
    .addEdge(START, "retrieve_step")
    .addEdge("retrieve_step", "gather_step")
    .addEdge("gather_step", "draft_step")
    .addEdge("draft_step", END)
    .compile();
}
function proposalGraph() {
  if (!_proposal) _proposal = compileProposal();
  return _proposal;
}

export async function generateProposal(input: {
  clientName: string;
  productIds: string[];
  notes: string;
}): Promise<Proposal> {
  const out = await proposalGraph().invoke({
    clientName: input.clientName,
    productIds: input.productIds ?? [],
    notes: input.notes ?? "",
  });
  return out.proposal;
}
