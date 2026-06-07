import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Chat area */}
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full flex flex-col">
        {/* Welcome banner — shown always at top */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-4 text-white shadow-md">
            <p className="text-sm font-semibold mb-0.5">
              Olá! Sou o assistente de análise da YMED.
            </p>
            <p className="text-xs text-green-100">
              Analiso dados de <strong>180 produtos</strong> — sabonetes, shampoos e detergentes —
              com previsões estatísticas para 2026. Clique em uma pergunta abaixo para começar.
            </p>
          </div>
        </div>

        {/* Chat interface takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 text-center text-xs text-gray-400 py-2 bg-white border-t border-gray-100">
        YMED Analytics · Dados sintéticos 2025 · Tendência linear + ABC
      </footer>
    </div>
  );
}
