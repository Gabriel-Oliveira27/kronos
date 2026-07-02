import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { escalaDiaAtualizarSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

const PAPEIS_QUE_EDITAM = ["CONFIGURADOR_ESCALA", "ADMIN"] as const;

interface Params {
  params: Promise<{ id: string }>;
}

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();
  if (!PAPEIS_QUE_EDITAM.includes(usuario.papel as (typeof PAPEIS_QUE_EDITAM)[number])) {
    throw ApiError.semPermissao();
  }

  const existente = await prisma.escalaDia.findUnique({ where: { id }, include: { usuario: { select: { nomeCompleto: true } } } });
  if (!existente) throw ApiError.naoEncontrado();

  const dados = escalaDiaAtualizarSchema.parse(await request.json());
  const atualizado = await prisma.escalaDia.update({
    where: { id },
    data: {
      ...(dados.tipo !== undefined ? { tipo: dados.tipo } : {}),
      ...(dados.observacao !== undefined ? { observacao: dados.observacao || null } : {}),
    },
  });

  await registrarEvento({
    tipo: "ESCALA_ALTERADA",
    usuarioId: usuario.id,
    detalhe: {
      escalaId: id,
      usuarioDestino: existente.usuarioId,
      mudancas: [{
        usuario: existente.usuario.nomeCompleto,
        data: existente.data.toISOString().slice(0, 10),
        antes: existente.tipo,
        depois: dados.tipo ?? existente.tipo,
      }],
    },
  });

  return NextResponse.json(atualizado);
});

export const DELETE = comTratamentoDeErro(async (_request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();
  if (!PAPEIS_QUE_EDITAM.includes(usuario.papel as (typeof PAPEIS_QUE_EDITAM)[number])) {
    throw ApiError.semPermissao();
  }

  const existente = await prisma.escalaDia.findUnique({ where: { id }, include: { usuario: { select: { nomeCompleto: true } } } });
  if (!existente) throw ApiError.naoEncontrado();

  // EscalaDia não está na lista de soft-delete do briefing (essa regra vale
  // para ponto e conhecimento) — aqui um delete remove o dia da escala de
  // fato, já que reatribuir/limpar um dia é uma operação normal e frequente
  // do configurador, não uma exclusão sensível que precise de auditoria
  // própria com recuperação.
  await prisma.escalaDia.delete({ where: { id } });

  await registrarEvento({
    tipo: "ESCALA_ALTERADA",
    usuarioId: usuario.id,
    detalhe: {
      escalaId: id,
      usuarioDestino: existente.usuarioId,
      acao: "remocao",
      mudancas: [{
        usuario: existente.usuario.nomeCompleto,
        data: existente.data.toISOString().slice(0, 10),
        antes: existente.tipo,
        depois: null,
      }],
    },
  });

  return NextResponse.json({ ok: true });
});
