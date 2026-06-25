import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * IP do cliente a partir dos headers do proxy (Vercel define `x-forwarded-for`).
 * Usado como chave de rate limiting. Nunca confiável para autorização, só para
 * limitar abuso.
 */
export function obterIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}

/**
 * Conta eventos recentes de um tipo, filtrando por uma chave dentro do JSON
 * `detalhe` (ex.: `ip`). Usa a tabela `LogEvento` (já indexada por tipo/criadoEm),
 * então funciona em serverless sem store externo (Redis etc.).
 *
 * Fail-open: qualquer erro de contagem retorna 0 — um problema no limitador
 * jamais pode bloquear um acesso legítimo.
 */
export async function contarEventos(
  tipo: string,
  chave: string,
  valor: string,
  janelaMs: number
): Promise<number> {
  const desde = new Date(Date.now() - janelaMs);
  try {
    return await prisma.logEvento.count({
      where: { tipo, criadoEm: { gte: desde }, detalhe: { path: [chave], equals: valor } },
    });
  } catch {
    return 0;
  }
}
