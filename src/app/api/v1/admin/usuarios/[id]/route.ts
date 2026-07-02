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
  // Trilha de auditoria: diff campo a campo (antes → depois), sem senha.
  const diffs: { campo: string; antes: unknown; depois: unknown }[] = [];
  const comparar = (campo: string, antes: unknown, depois: unknown) => {
    if (depois !== undefined && JSON.stringify(antes) !== JSON.stringify(depois)) {
      diffs.push({ campo, antes: antes ?? null, depois: depois ?? null });
    }
  };
  comparar("nomeCompleto", existente.nomeCompleto, dados.nomeCompleto);
  comparar("setores", existente.setores.length ? existente.setores : [existente.setor], setores);
  comparar("email", existente.email, dados.email !== undefined ? (dados.email || null) : undefined);
  comparar("papel", existente.papel, dados.papel);
  comparar("temApp", existente.temApp, dados.temApp);
  comparar("ativo", existente.ativo, dados.ativo);
  comparar("modeloHorarioId", existente.modeloHorarioId, dados.modeloHorarioId !== undefined ? (dados.modeloHorarioId || null) : undefined);
  if (dados.novaSenha) diffs.push({ campo: "senha", antes: "•••", depois: "(alterada)" });
  if (dados.fotoUrl !== undefined && (dados.fotoUrl || null) !== existente.fotoUrl) {
    diffs.push({ campo: "foto", antes: existente.fotoUrl ? "(tinha)" : null, depois: dados.fotoUrl ? "(nova)" : null });
  }

  await registrarEvento({ tipo:"ACESSO_EDITADO", usuarioId:admin.id,
    detalhe:{ usuarioEditadoId:id, usuarioEditadoNome: existente.nomeCompleto, campos:Object.keys(dados), diffs } });
  return NextResponse.json(atualizado);
});
