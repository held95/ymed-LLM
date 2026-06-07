import fs from "fs";
import path from "path";
import { CorporateChunk, CorporateKnowledge, RetrievedChunk } from "@/types";

/**
 * Retrieval leve (TF-IDF em memória) sobre os documentos internos pré-indexados.
 * Sem vector DB, sem embeddings em runtime, sem ML — determinístico e instantâneo,
 * adequado a uma base interna pequena. É o que mantém o assistente "suave" e sem
 * travamentos.
 */

interface Index {
  knowledge: CorporateKnowledge;
  tokensByChunk: string[][];
  idf: Map<string, number>;
}

let _index: Index | null = null;

// Stopwords pt-BR (curtas e frequentes) para reduzir ruído.
const STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "ou", "que", "qual", "quais",
  "para", "por", "com", "sem", "em", "no", "na", "nos", "nas", "um", "uma", "uns", "umas",
  "ao", "aos", "se", "seu", "sua", "ser", "tem", "the", "of", "to", "como", "quanto",
  "quantos", "quanta", "onde", "sobre", "entre", "ate", "mais", "menos", "muito", "pode",
  "posso", "voce", "voces", "meu", "minha",
]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function tokenize(text: string): string[] {
  return stripAccents(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function buildIndex(): Index {
  const filePath = path.join(process.cwd(), "public", "corporate-knowledge.json");
  const knowledge = JSON.parse(fs.readFileSync(filePath, "utf-8")) as CorporateKnowledge;
  const tokensByChunk = knowledge.chunks.map((c) => tokenize(c.text));

  const df = new Map<string, number>();
  for (const tokens of tokensByChunk) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const N = knowledge.chunks.length;
  const idf = new Map<string, number>();
  for (const [term, d] of df) idf.set(term, Math.log((N + 1) / (d + 1)) + 1);

  return { knowledge, tokensByChunk, idf };
}

export function getCorporateIndex(): Index {
  if (_index) return _index;
  _index = buildIndex();
  return _index;
}

export function retrieve(query: string, k = 4): RetrievedChunk[] {
  const { knowledge, tokensByChunk, idf } = getCorporateIndex();
  const qTerms = tokenize(query);
  if (qTerms.length === 0) return [];
  const qSet = new Set(qTerms);

  const scored = knowledge.chunks.map((chunk: CorporateChunk, i: number) => {
    const tokens = tokensByChunk[i];
    const tf = new Map<string, number>();
    for (const t of tokens) if (qSet.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    // TF sublinear (1 + log(count)) — evita que um termo repetido (ex.: a categoria
    // "shampoo" repetida em cada linha da tabela de preços) domine o ranking.
    for (const [term, count] of tf) score += (1 + Math.log(count)) * (idf.get(term) ?? 0);
    // Normaliza pelo tamanho do chunk para não favorecer textos longos.
    score = tokens.length > 0 ? score / Math.sqrt(tokens.length) : 0;
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/** Lista as fontes disponíveis (para a UI). */
export function getCorporateSources(): { sources: string[]; chunkCount: number; generatedAt: string } {
  const { knowledge } = getCorporateIndex();
  return {
    sources: knowledge.sources,
    chunkCount: knowledge.chunkCount,
    generatedAt: knowledge.generatedAt,
  };
}
