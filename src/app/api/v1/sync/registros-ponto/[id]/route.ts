import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

interface Params {
  params: Promise<{ id: string }>;
}

export const DELETE = comTratamentoDeErro(async (_request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();

  const existente = await prisma.registroPonto.findUnique({ where: { id } });
  if (!existente || existente.deletadoEm) throw ApiError.naoEncontrado();
  if (existente.usuarioId !== usuario.id) throw ApiError.semPermissao();

  await prisma.$transaction(async (tx) => {
    const excluido = await tx.registroPonto.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });

    await tx.registroExcluido.create({
      data: {
        tabelaOrigem: "RegistroPonto",
        registroId: excluido.id,
        payload: JSON.parse(JSON.stringify(excluido)),
        excluidoPorId: usuario.id,
      },
    });
  });

  await registrarEvento({ tipo: "PONTO_EXCLUIDO", usuarioId: usuario.id, detalhe: { id } });

  return NextResponse.json({ ok: true });
});
