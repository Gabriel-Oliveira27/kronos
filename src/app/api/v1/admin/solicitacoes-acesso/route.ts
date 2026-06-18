import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { comTratamentoDeErro } from "@/lib/api";

export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  await exigirPapel("ADMIN");
  const status = new URL(request.url).searchParams.get("status");

  const solicitacoes = await prisma.solicitacaoAcesso.findMany({
    where: status ? { status } : {},
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(solicitacoes);
});
