import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { registroPontoWebSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";

interface Params { params: Promise<{ id: string }> }

async function checarDono(id: string, usuarioId: string) {
  const reg = await prisma.registroPonto.findUnique({ where: { id } });
  if (!reg || reg.deletadoEm) throw ApiError.naoEncontrado();
  if (reg.usuarioId !== usuarioId) throw new ApiError(403,"Sem permissão.","PROIBIDO");
  return reg;
}

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();
  await checarDono(id, usuario.id);
  const dados = registroPontoWebSchema.parse(await request.json());
  const atualizado = await prisma.registroPonto.update({
    where: { id },
    data: { tipoEvento: dados.tipoEvento, horarioReal: dados.horarioReal, data: dados.data },
  });
  return NextResponse.json(atualizado);
});

export const DELETE = comTratamentoDeErro(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const usuario = await exigirUsuario();
  await checarDono(id, usuario.id);
  await prisma.registroPonto.update({ where: { id }, data: { deletadoEm: new Date() } });
  return NextResponse.json({ ok: true });
});
