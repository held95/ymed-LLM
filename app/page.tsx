import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center shadow">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-tight">
                YMED Analytics
              </h1>
              <p className="text-xs text-gray-500 leading-tight">
                Inteligência de Vendas · Powered by Claude AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              2025
            </span>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full flex flex-col">
        {/* Welcome banner — shown always at top */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-4 text-white shadow-md">
            <p className="text-sm font-semibold mb-0.5">
              Olá! Sou o assistente de análise da YMED.
            </p>
            <p className="text-xs text-green-100">
              Analiso dados de <strong>50 produtos</strong> — sabonetes, shampoos e detergentes —
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
        YMED Analytics · Dados sintéticos 2025 · Modelos ARIMA + ABC
      </footer>
    </div>
  );
}
