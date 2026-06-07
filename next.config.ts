import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantém pacotes server-only (LangChain/LangGraph) fora do bundle — evita
  // problemas de empacotamento e mantém as rotas leves no runtime Node.
  serverExternalPackages: [
    "@langchain/langgraph",
    "@langchain/anthropic",
    "@langchain/core",
  ],
};

export default nextConfig;
