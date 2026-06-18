import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";
import { z } from "zod";

interface Params {
  params: Promise<{ id: string }>;
}

const corpoSchema = z.object({ status: z.enum(["rejeitada", "pendente"]) });

export const PATCH = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const admin = await exigirPapel("ADMIN");

  const existente = await prisma.solicitacaoAcesso.findUnique({ where: { id } });
  if (!existente) throw ApiError.naoEncontrado();

  const { status } = corpoSchema.parse(await request.json());

  const atualizada = await prisma.solicitacaoAcesso.update({ where: { id }, data: { status } });

  if (status === "rejeitada") {
    await registrarEvento({
      tipo: "SOLICITACAO_REJEITADA",
      usuarioId: admin.id,
      detalhe: { solicitacaoId: id },
    });
  }

  return NextResponse.json(atualizada);
});
