import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { modeloHorarioSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";

interface Params { params: Promise<{ id: string }> }

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  await exigirPapel("CONFIGURADOR_ESCALA","ADMIN");
  if (!await prisma.modeloHorario.findUnique({ where: { id } })) throw ApiError.naoEncontrado();
  const dados = modeloHorarioSchema.parse(await request.json());
  const atualizado = await prisma.modeloHorario.update({
    where: { id },
    data: { nome: dados.nome, descricao: dados.descricao || null,
      horasSemanais: dados.horasSemanais, jornadaDiaria: dados.jornadaDiaria,
      configuracao: dados.configuracao ? JSON.parse(JSON.stringify(dados.configuracao)) : null },
  });
  return NextResponse.json(atualizado);
});

export const DELETE = comTratamentoDeErro(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  await exigirPapel("CONFIGURADOR_ESCALA","ADMIN");
  if (!await prisma.modeloHorario.findUnique({ where: { id } })) throw ApiError.naoEncontrado();
  await prisma.usuario.updateMany({ where: { modeloHorarioId: id }, data: { modeloHorarioId: null } });
  await prisma.modeloHorario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
