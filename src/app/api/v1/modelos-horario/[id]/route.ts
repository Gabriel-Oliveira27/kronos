import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { modeloHorarioSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

interface Params { params: Promise<{ id: string }> }

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirPapel("CONFIGURADOR_ESCALA","ADMIN");
  const existente = await prisma.modeloHorario.findUnique({ where: { id } });
  if (!existente) throw ApiError.naoEncontrado();
  const dados = modeloHorarioSchema.parse(await request.json());
  const atualizado = await prisma.modeloHorario.update({
    where: { id },
    data: { nome: dados.nome, descricao: dados.descricao || null,
      horasSemanais: dados.horasSemanais, jornadaDiaria: dados.jornadaDiaria,
      jornadaPlantao: dados.jornadaPlantao,
      configuracao: dados.configuracao ? JSON.parse(JSON.stringify(dados.configuracao)) : null },
  });
  // Diff antes/depois dos campos numéricos e nome para a auditoria.
  const diffs: { campo: string; antes: unknown; depois: unknown }[] = [];
  if (existente.nome !== atualizado.nome) diffs.push({ campo: "nome", antes: existente.nome, depois: atualizado.nome });
  if (existente.horasSemanais !== atualizado.horasSemanais) diffs.push({ campo: "horasSemanais", antes: existente.horasSemanais, depois: atualizado.horasSemanais });
  if (existente.jornadaDiaria !== atualizado.jornadaDiaria) diffs.push({ campo: "jornadaDiaria", antes: existente.jornadaDiaria, depois: atualizado.jornadaDiaria });
  if (existente.jornadaPlantao !== atualizado.jornadaPlantao) diffs.push({ campo: "jornadaPlantao", antes: existente.jornadaPlantao, depois: atualizado.jornadaPlantao });
  await registrarEvento({
    tipo: "MODELO_HORARIO_EDITADO",
    usuarioId: usuario.id,
    detalhe: { modeloId: id, nome: atualizado.nome, diffs },
  });
  return NextResponse.json(atualizado);
});

export const DELETE = comTratamentoDeErro(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirPapel("CONFIGURADOR_ESCALA","ADMIN");
  const existente = await prisma.modeloHorario.findUnique({ where: { id }, include: { _count: { select: { usuarios: true } } } });
  if (!existente) throw ApiError.naoEncontrado();
  await prisma.usuario.updateMany({ where: { modeloHorarioId: id }, data: { modeloHorarioId: null } });
  await prisma.modeloHorario.delete({ where: { id } });
  await registrarEvento({
    tipo: "MODELO_HORARIO_EXCLUIDO",
    usuarioId: usuario.id,
    detalhe: { modeloId: id, nome: existente.nome, usuariosDesvinculados: existente._count.usuarios },
  });
  return NextResponse.json({ ok: true });
});
