import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { comTratamentoDeErro } from "@/lib/api";

export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  await exigirPapel("ADMIN");
  const take = Math.min(Number(new URL(request.url).searchParams.get("take")) || 100, 300);

  const registros = await prisma.registroExcluido.findMany({
    orderBy: { excluidoEm: "desc" },
    take,
  });

  return NextResponse.json(registros);
});
