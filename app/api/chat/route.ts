import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, SYSTEM_PROMPT } from "@/lib/anthropic";
import { getForecasts } from "@/lib/data";
import { QUESTIONS } from "@/lib/questions";
import { Forecasts } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { question_id } = await req.json();

    if (!question_id || question_id < 1 || question_id > 7) {
      return NextResponse.json({ error: "question_id inválido (1–7)" }, { status: 400 });
    }

    const question = QUESTIONS.find((q) => q.id === question_id);
    if (!question) {
      return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
    }

    const forecasts = getForecasts();
    const dataSlice = forecasts[question.dataSliceKey as keyof Forecasts];
    const summaryContext = {
      total_products: forecasts.summary.total_products,
      total_revenue_2025: forecasts.summary.total_revenue_2025,
      total_units_2025: forecasts.summary.total_units_2025,
    };

    const userMessage = `PERGUNTA: ${question.text}

CONTEXTO GERAL DA YMED 2025:
${JSON.stringify(summaryContext, null, 2)}

DADOS RELEVANTES:
${JSON.stringify(dataSlice, null, 2)}`;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 450,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const answer =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({
      answer,
      chart_type: question.chartType,
      chart_data: dataSlice,
      question_text: question.text,
    });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar a pergunta." },
      { status: 500 }
    );
  }
}
