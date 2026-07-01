import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { setorSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

interface Params { params: Promise<{ id: string }> }

/**
 * PUT — renomeia um setor (admin). Renomear NÃO reescreve o campo `setor` dos
 * usuários já vinculados por nome; para manter os vínculos, os usuários são
 * atualizados em bloco na mesma transação.
 */
export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const admin = await exigirPapel("ADMIN");

  const existente = await prisma.setor.findUnique({ where: { id } });
  if (!existente) throw ApiError.naoEncontrado("Setor não encontrado.");

  const { nome } = setorSchema.parse(await request.json());
  const conflito = await prisma.setor.findFirst({ where: { nome, NOT: { id } } });
  if (conflito) throw new ApiError(409, "Já existe um setor com esse nome.", "SETOR_DUPLICADO");

  const [setor] = await prisma.$transaction([
    prisma.setor.update({ where: { id }, data: { nome } }),
    prisma.usuario.updateMany({ where: { setor: existente.nome }, data: { setor: nome } }),
  ]);

  await registrarEvento({ tipo: "SETOR_EDITADO", usuarioId: admin.id, detalhe: { setorId: id, de: existente.nome, para: nome } });
  return NextResponse.json({ id: setor.id, nome: setor.nome, temPalavra: !!setor.palavraSecretaHash });
});

export const DELETE = comTratamentoDeErro(async (_request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const admin = await exigirPapel("ADMIN");

  const existente = await prisma.setor.findUnique({ where: { id } });
  if (!existente) throw ApiError.naoEncontrado("Setor não encontrado.");

  const emUso = await prisma.usuario.count({ where: { setor: existente.nome } });
  if (emUso > 0) {
    throw new ApiError(409, `Este setor está vinculado a ${emUso} usuário(s). Realoque-os antes de excluir.`, "SETOR_EM_USO");
  }

  await prisma.setor.delete({ where: { id } });
  await registrarEvento({ tipo: "SETOR_EXCLUIDO", usuarioId: admin.id, detalhe: { setorId: id, nome: existente.nome } });
  return NextResponse.json({ ok: true });
});
