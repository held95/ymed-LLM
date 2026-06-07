"use client";
import { useEffect, useRef, useState } from "react";
import { CorporateSourceRef, ProductListItem, Proposal } from "@/types";
import { downloadProposalPdf } from "@/lib/pdf/proposalPdf";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: CorporateSourceRef[];
  loading?: boolean;
}

const SUGGESTIONS = [
  "Qual o desconto para pedidos acima de 500 caixas?",
  "Qual o prazo de entrega para o Nordeste?",
  "Quais certificações os produtos YMED possuem?",
  "Qual é o pedido mínimo (MOQ) por pedido?",
];

export default function CorporateBrain() {
  const [sources, setSources] = useState<string[]>([]);
  const [chunkCount, setChunkCount] = useState<number>(0);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Proposta
  const [allProducts, setAllProducts] = useState<ProductListItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState<ProductListItem[]>([]);
  const [pSearch, setPSearch] = useState("");
  const [showPick, setShowPick] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [lastProposal, setLastProposal] = useState<Proposal | null>(null);
  const pickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/corporate-brain")
      .then((r) => r.json())
      .then((d) => {
        setSources(d.sources ?? []);
        setChunkCount(d.chunkCount ?? 0);
      })
      .catch(() => {});
    fetch("/api/products-filters")
      .then((r) => r.json())
      .then((d) => setAllProducts(d.products_list ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (pickRef.current && !pickRef.current.contains(e.target as Node)) setShowPick(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function ask(q: string) {
    const query = q.trim();
    if (!query || asking) return;
    setQuestion("");
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: query };
    const loadingMsg: ChatMsg = { id: `a-${Date.now()}`, role: "assistant", content: "", loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setAsking(true);
    try {
      const res = await fetch("/api/corporate-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                loading: false,
                content: data.answer ?? data.error ?? "Sem resposta.",
                sources: data.sources ?? [],
              }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, loading: false, content: "Erro ao consultar. Verifique a chave de API." }
            : m
        )
      );
    } finally {
      setAsking(false);
    }
  }

  const pickFiltered = allProducts.filter((p) => {
    if (pSearch.length < 2) return false;
    if (picked.some((x) => x.product_id === p.product_id)) return false;
    const q = pSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.product_id.toLowerCase().includes(q);
  });

  async function generate() {
    if (!clientName.trim() || genLoading) return;
    setGenLoading(true);
    setGenError("");
    setLastProposal(null);
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          productIds: picked.map((p) => p.product_id),
          notes: notes.trim(),
        }),
      });
      if (!res.ok) throw new Error("erro");
      const proposal: Proposal = await res.json();
      setLastProposal(proposal);
      downloadProposalPdf(proposal);
    } catch {
      setGenError("Não foi possível gerar a proposta. Verifique a chave de API.");
    } finally {
      setGenLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cérebro Corporativo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pergunte sobre os documentos internos da YMED ou gere uma proposta comercial em PDF.
            {chunkCount > 0 && (
              <span className="text-gray-400">
                {" "}
                Base: {sources.length} documentos · {chunkCount} trechos indexados.
              </span>
            )}
          </p>
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {sources.map((s) => (
                <span key={s} className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  📄 {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Chat sobre documentos */}
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col min-h-[420px]">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Perguntar aos documentos</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Experimente:</p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 text-gray-600"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-green-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[90%] w-full bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                      {m.loading ? (
                        <div className="flex gap-1 items-center h-5">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          {m.sources && m.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
                              {m.sources.map((s, i) => (
                                <span key={i} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                                  {s.source}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              )}
              <div ref={bottomRef} />
            </div>
            <div className="px-3 py-3 border-t border-gray-100 flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask(question)}
                placeholder="Pergunte sobre política, preços, prazos, certificações…"
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                onClick={() => ask(question)}
                disabled={asking || question.trim().length < 3}
                className="bg-green-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-green-700 disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </div>

          {/* Gerador de proposta */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3 h-fit">
            <p className="text-sm font-semibold text-gray-800">Gerar proposta comercial (PDF)</p>
            <p className="text-xs text-gray-400 -mt-1">
              A proposta usa a política comercial e a tabela de preços internas.
            </p>

            <div>
              <label className="text-xs font-medium text-gray-500">Cliente</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex.: Distribuidora Sol Nordeste Ltda."
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="relative" ref={pickRef}>
              <label className="text-xs font-medium text-gray-500">Produtos (opcional)</label>
              <input
                value={pSearch}
                onChange={(e) => {
                  setPSearch(e.target.value);
                  setShowPick(true);
                }}
                onFocus={() => setShowPick(true)}
                placeholder="Buscar e adicionar produtos…"
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {showPick && pickFiltered.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {pickFiltered.slice(0, 20).map((p) => (
                    <button
                      key={p.product_id}
                      onClick={() => {
                        setPicked((prev) => [...prev, p]);
                        setPSearch("");
                        setShowPick(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-green-50 border-b border-gray-50 last:border-0"
                    >
                      {p.name} <span className="text-xs text-gray-400">· {p.product_id}</span>
                    </button>
                  ))}
                </div>
              )}
              {picked.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {picked.map((p) => (
                    <span key={p.product_id} className="inline-flex items-center gap-1 text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                      {p.name.replace("YMED ", "")}
                      <button onClick={() => setPicked((prev) => prev.filter((x) => x.product_id !== p.product_id))} className="text-green-500 hover:text-green-800">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ex.: cliente do Nordeste, pedido estimado de 600 caixas/mês."
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>

            {genError && <p className="text-xs text-rose-600">{genError}</p>}

            <button
              onClick={generate}
              disabled={genLoading || !clientName.trim()}
              className="w-full bg-green-600 text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-green-700 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {genLoading ? (
                <>
                  <span className="w-2 h-2 bg-white/80 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-white/80 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-white/80 rounded-full animate-bounce [animation-delay:300ms]" />
                </>
              ) : (
                "📄 Gerar proposta em PDF"
              )}
            </button>

            {lastProposal && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-green-700">{lastProposal.title}</p>
                <p>{lastProposal.sections.length} seções · {lastProposal.pricing.length} itens de preço</p>
                <button onClick={() => downloadProposalPdf(lastProposal)} className="text-green-700 underline">
                  Baixar PDF novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
