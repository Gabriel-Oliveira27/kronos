import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que o Turbopack tente empacotar o client do Prisma e o adapter do
  // Neon — eles são carregados em runtime via node_modules. Sem isso, builds
  // com Turbopack (padrão no Next 16) podem falhar ao resolver o client do
  // Prisma gerado.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],

  // No Next.js 16 a configuração do Turbopack é uma chave top-level (até a
  // 15.2.x vinha em `experimental.turbo`/`experimental.turbopack`).
  turbopack: {
    resolveAlias: {
      ".prisma/client/default": "./node_modules/.prisma/client/default.js",
    },
  },
};

export default nextConfig;
