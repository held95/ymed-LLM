/**
 * Teste offline do retrieval do Cérebro Corporativo (não precisa de API key).
 * Replica a lógica TF-IDF de lib/corporate.ts sobre public/corporate-knowledge.json
 * e verifica se perguntas conhecidas recuperam a fonte esperada.
 *
 * Uso: node data/test_corporate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "ou", "que", "qual", "quais",
  "para", "por", "com", "sem", "em", "no", "na", "nos", "nas", "um", "uma", "uns", "umas",
  "ao", "aos", "se", "seu", "sua", "ser", "tem", "the", "of", "to", "como", "quanto",
  "quantos", "quanta", "onde", "sobre", "entre", "ate", "mais", "menos", "muito", "pode",
  "posso", "voce", "voces", "meu", "minha",
]);
const stripAccents = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
const tokenize = (t) =>
  stripAccents(t.toLowerCase()).replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w));

const knowledge = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "corporate-knowledge.json"), "utf-8"));
const tokensByChunk = knowledge.chunks.map((c) => tokenize(c.text));
const df = new Map();
for (const toks of tokensByChunk) for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
const N = knowledge.chunks.length;
const idf = new Map();
for (const [t, d] of df) idf.set(t, Math.log((N + 1) / (d + 1)) + 1);

// Retorna as fontes dos top-k chunks (mesma forma como a rota usa o retrieval:
// os k melhores trechos vão para o LLM, não apenas o primeiro).
function topSources(query, k = 3) {
  const qSet = new Set(tokenize(query));
  const scored = knowledge.chunks.map((chunk, i) => {
    const toks = tokensByChunk[i];
    const tf = new Map();
    for (const t of toks) if (qSet.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const [term, count] of tf) score += (1 + Math.log(count)) * (idf.get(term) ?? 0);
    score = toks.length ? score / Math.sqrt(toks.length) : 0;
    return { source: chunk.source, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}

const CASES = [
  { q: "Qual o desconto para pedidos acima de 500 caixas?", expect: "Política Comercial" },
  { q: "Qual o preço de distribuidor dos produtos?", expect: "Tabela de Preços" },
  { q: "Quais certificações os produtos YMED possuem?", expect: "FAQ Interno" },
  { q: "Quais essências exclusivas a YMED oferece?", expect: "Catálogo de Produtos" },
];

let pass = 0;
for (const c of CASES) {
  const top = topSources(c.q, 3);
  const sources = top.map((t) => t.source);
  const ok = sources.includes(c.expect);
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FALHA"}  "${c.q}" -> top3: [${[...new Set(sources)].join(", ")}] (esperado conter: ${c.expect})`);
}
console.log(`\n${pass}/${CASES.length} testes de retrieval OK.`);
process.exit(pass === CASES.length ? 0 : 1);
