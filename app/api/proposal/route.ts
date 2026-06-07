import { NextRequest, NextResponse } from "next/server";
import { generateProposal } from "@/lib/corporate-graph";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { clientName, productIds, notes } = await req.json();
    if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
      return NextResponse.json({ error: "Informe o nome do cliente." }, { status: 400 });
    }
    const proposal = await generateProposal({
      clientName: clientName.trim(),
      productIds: Array.isArray(productIds) ? productIds : [],
      notes: typeof notes === "string" ? notes : "",
    });
    return NextResponse.json(proposal);
  } catch (err) {
    console.error("[/api/proposal] error:", err);
    return NextResponse.json({ error: "Erro ao gerar a proposta." }, { status: 500 });
  }
}
