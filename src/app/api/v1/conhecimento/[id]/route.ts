import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { conhecimentoItemAtualizarSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

interface Params {
  params: Promise<{ id: string }>;
}

// Edição e exclusão são restritas ao autor — mesmo o ADMIN, que só tem
// permissão de VISUALIZAR itens privados de terceiros (auditoria), não de
// editá-los ou excluí-los. Ver briefing §6.

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();
  const corpo = await request.json();
  const dados = conhecimentoItemAtualizarSchema.parse(corpo);

  const existente = await prisma.conhecimentoItem.findUnique({ where: { id } });
  if (!existente || existente.deletadoEm) throw ApiError.naoEncontrado();
  if (existente.autorId !== usuario.id) throw ApiError.semPermissao();

  const atualizado = await prisma.conhecimentoItem.update({
    where: { id },
    data: {
      ...(dados.titulo !== undefined ? { titulo: dados.titulo } : {}),
      ...(dados.conteudo !== undefined ? { conteudo: dados.conteudo } : {}),
      ...(dados.categoria !== undefined ? { categoria: dados.categoria || null } : {}),
      ...(dados.tags !== undefined ? { tags: dados.tags } : {}),
      ...(dados.visibilidade !== undefined ? { visibilidade: dados.visibilidade } : {}),
    },
  });

  return NextResponse.json(atualizado);
});

export const DELETE = comTratamentoDeErro(async (_request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();

  const existente = await prisma.conhecimentoItem.findUnique({ where: { id } });
  if (!existente || existente.deletadoEm) throw ApiError.naoEncontrado();
  if (existente.autorId !== usuario.id) throw ApiError.semPermissao();

  await prisma.$transaction(async (tx) => {
    const excluido = await tx.conhecimentoItem.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });

    await tx.registroExcluido.create({
      data: {
        tabelaOrigem: "ConhecimentoItem",
        registroId: excluido.id,
        payload: JSON.parse(JSON.stringify(excluido)),
        excluidoPorId: usuario.id,
      },
    });
  });

  await registrarEvento({ tipo: "CONHECIMENTO_EXCLUIDO", usuarioId: usuario.id, detalhe: { id } });

  return NextResponse.json({ ok: true });
});
