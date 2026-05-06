"use client";
import { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import MessageBubble from "./MessageBubble";
import SuggestedQuestions from "./SuggestedQuestions";
import { QUESTIONS } from "@/lib/questions";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleQuestion(questionId: number) {
    if (isLoading) return;

    const question = QUESTIONS.find((q) => q.id === questionId);
    if (!question) return;

    setHasStarted(true);
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question.text,
    };
    const loadingMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId }),
      });

      if (!res.ok) throw new Error("Erro na API");

      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: data.answer,
                chartType: data.chart_type,
                chartData: data.chart_data,
                isLoading: false,
              }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique se a chave de API está configurada corretamente.",
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setHasStarted(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {!hasStarted && (
          <div className="py-4">
            <SuggestedQuestions onSelect={handleQuestion} disabled={isLoading} />
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Bottom toolbar when chat has started */}
      {hasStarted && (
        <div className="border-t border-gray-100 px-4 py-3 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Selecione outra pergunta abaixo para continuar
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              Reiniciar conversa
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUESTIONS.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuestion(q.id)}
                disabled={isLoading}
                className="text-left text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 text-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
