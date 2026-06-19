import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que o Turbopack tente empacotar o client do Prisma e o adapter do
  // Neon — eles devem ser resolvidos em runtime via node_modules.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],
};

export default nextConfig;
