import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prisma 7 não aceita mais `new PrismaClient()` sem adapter — a conexão tem
// que vir de um driver adapter explícito. Para o Neon, isso significa usar a
// connection string COM pooling (host "-pooler"), que é a indicada para uso
// em ambiente serverless (cada invocação de função é uma conexão nova).
//
// Padrão de singleton em globalThis para não esgotar o pool de conexões com
// múltiplas instâncias durante hot-reload no `next dev`.

declare global {
  // eslint-disable-next-line no-var
  var __kronosPrisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não está definida. Configure a connection string com pooling do Neon (host com '-pooler')."
    );
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalThis.__kronosPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__kronosPrisma = prisma;
}
