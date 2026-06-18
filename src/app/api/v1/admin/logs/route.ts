import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { comTratamentoDeErro } from "@/lib/api";

export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  await exigirPapel("ADMIN", "SUPORTE");
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") || undefined;
  const take = Math.min(Number(searchParams.get("take")) || 100, 300);

  const logs = await prisma.logEvento.findMany({
    where: tipo ? { tipo } : {},
    orderBy: { criadoEm: "desc" },
    take,
    include: { usuario: { select: { id: true, nomeCompleto: true, username: true } } },
  });

  return NextResponse.json(logs);
});
