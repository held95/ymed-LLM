import { NextRequest, NextResponse } from "next/server";
import { askCorporateBrain } from "@/lib/corporate-graph";
import { getCorporateSources } from "@/lib/corporate";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(getCorporateSources());
  } catch (err) {
    console.error("[/api/corporate-brain] GET error:", err);
    return NextResponse.json({ error: "Base de conhecimento indisponível." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return NextResponse.json({ error: "Pergunta inválida." }, { status: 400 });
    }
    const result = await askCorporateBrain(question.trim());
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/corporate-brain] POST error:", err);
    return NextResponse.json(
      { error: "Erro ao consultar o Cérebro Corporativo. Verifique se a chave de API está configurada." },
      { status: 500 }
    );
  }
}
