import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { conhecimentoItemAtualizarSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

interface Params { params: Promise<{ id: string }> }

async function verificarAcesso(id: string, usuarioId: string, papel: string) {
  const item = await prisma.conhecimentoItem.findUnique({ where: { id } });
  if (!item || item.deletadoEm) throw ApiError.naoEncontrado();
  // Admin pode editar/excluir qualquer item; autor pode editar o próprio
  const isAdmin = papel === "ADMIN" || papel === "SUPORTE";
  if (!isAdmin && item.autorId !== usuarioId) throw new ApiError(403, "Sem permissão.", "PROIBIDO");
  return item;
}

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();
  await verificarAcesso(id, usuario.id, usuario.papel);
  const dados = conhecimentoItemAtualizarSchema.parse(await request.json());
  const atualizado = await prisma.conhecimentoItem.update({
    where: { id }, data: { ...dados, tags: dados.tags ?? undefined },
    include: { autor: { select: { id: true, nomeCompleto: true } } },
  });
  return NextResponse.json(atualizado);
});

export const DELETE = comTratamentoDeErro(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();
  await verificarAcesso(id, usuario.id, usuario.papel);
  await prisma.conhecimentoItem.update({ where: { id }, data: { deletadoEm: new Date() } });
  await registrarEvento({
    tipo: "CONHECIMENTO_EXCLUIDO", usuarioId: usuario.id,
    detalhe: { itemId: id },
  });
  return NextResponse.json({ ok: true });
});
