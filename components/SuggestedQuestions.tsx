"use client";
import { QUESTIONS } from "@/lib/questions";

const ICONS = ["🏆", "💰", "📈", "⚖️", "🧪", "🌸", "📊"];

interface Props {
  onSelect: (questionId: number) => void;
  disabled: boolean;
}

export default function SuggestedQuestions({ onSelect, disabled }: Props) {
  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 text-center mb-3">
        Escolha uma pergunta para começar a análise
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUESTIONS.map((q, i) => (
          <button
            key={q.id}
            onClick={() => onSelect(q.id)}
            disabled={disabled}
            className="flex items-start gap-2 text-left px-4 py-3 rounded-xl border border-green-200 bg-white hover:bg-green-50 hover:border-green-400 transition-all text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <span className="text-base mt-0.5 shrink-0">{ICONS[i]}</span>
            <span>{q.text}</span>
          </button>
        ))}
        {/* 7th question spans full width on sm */}
        <style jsx>{`
          .grid > button:last-child {
            grid-column: 1 / -1;
          }
        `}</style>
      </div>
    </div>
  );
}
