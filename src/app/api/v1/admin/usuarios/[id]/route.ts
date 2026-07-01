import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { atualizarUsuarioSchema } from "@/lib/validations";
import { hashSenha } from "@/lib/auth";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

const SELECT = {
  id:true,nomeCompleto:true,setor:true,setores:true,email:true,username:true,papel:true,
  temApp:true,ativo:true,ehGhost:true,fotoUrl:true,modeloHorarioId:true,criadoEm:true,atualizadoEm:true,
} as const;
interface Params { params: Promise<{ id: string }> }

export const PUT = comTratamentoDeErro(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const admin = await exigirPapel("ADMIN");
  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) throw ApiError.naoEncontrado();
  const dados = atualizarUsuarioSchema.parse(await request.json());
  // Multi-setor: se `setores` vier, ele manda; o `setor` principal vira o 1º.
  const setores = dados.setores && dados.setores.length > 0
    ? dados.setores
    : dados.setor !== undefined ? [dados.setor] : undefined;
  const atualizado = await prisma.usuario.update({
    where: { id },
    data: {
      ...(dados.nomeCompleto !== undefined ? { nomeCompleto: dados.nomeCompleto } : {}),
      ...(setores !== undefined ? { setor: setores[0], setores } : {}),
      ...(dados.email       !== undefined ? { email: dados.email || null } : {}),
      ...(dados.papel       !== undefined ? { papel: dados.papel } : {}),
      ...(dados.temApp      !== undefined ? { temApp: dados.temApp } : {}),
      ...(dados.ativo       !== undefined ? { ativo: dados.ativo } : {}),
      ...(dados.ehGhost     !== undefined ? { ehGhost: dados.ehGhost } : {}),
      ...(dados.fotoUrl     !== undefined ? { fotoUrl: dados.fotoUrl || null } : {}),
      ...(dados.novaSenha ? { senhaHash: await hashSenha(dados.novaSenha) } : {}),
      ...(dados.modeloHorarioId !== undefined ? { modeloHorarioId: dados.modeloHorarioId || null } : {}),
    },
    select: SELECT,
  });
  await registrarEvento({ tipo:"ACESSO_EDITADO", usuarioId:admin.id,
    detalhe:{ usuarioEditadoId:id, campos:Object.keys(dados), ativo:dados.ativo } });
  return NextResponse.json(atualizado);
});
