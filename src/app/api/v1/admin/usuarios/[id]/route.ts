import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { atualizarUsuarioSchema } from "@/lib/validations";
import { hashSenha } from "@/lib/auth";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

const SELECAO_SEGURA = {
  id: true,
  nomeCompleto: true,
  setor: true,
  email: true,
  username: true,
  papel: true,
  temApp: true,
  fotoUrl: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

interface Params {
  params: Promise<{ id: string }>;
}

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const admin = await exigirPapel("ADMIN");

  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) throw ApiError.naoEncontrado();

  const dados = atualizarUsuarioSchema.parse(await request.json());

  const atualizado = await prisma.usuario.update({
    where: { id },
    data: {
      ...(dados.nomeCompleto !== undefined ? { nomeCompleto: dados.nomeCompleto } : {}),
      ...(dados.setor !== undefined ? { setor: dados.setor } : {}),
      ...(dados.email !== undefined ? { email: dados.email || null } : {}),
      ...(dados.papel !== undefined ? { papel: dados.papel } : {}),
      ...(dados.temApp !== undefined ? { temApp: dados.temApp } : {}),
      ...(dados.fotoUrl !== undefined ? { fotoUrl: dados.fotoUrl || null } : {}),
      ...(dados.temaBase !== undefined ? { temaBase: dados.temaBase } : {}),
      ...(dados.corDestaque !== undefined ? { corDestaque: dados.corDestaque || null } : {}),
      ...(dados.novaSenha ? { senhaHash: await hashSenha(dados.novaSenha) } : {}),
    },
    select: SELECAO_SEGURA,
  });

  await registrarEvento({
    tipo: "ACESSO_EDITADO",
    usuarioId: admin.id,
    detalhe: { usuarioEditadoId: id, campos: Object.keys(dados) },
  });

  return NextResponse.json(atualizado);
});
