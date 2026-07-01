import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { criarUsuarioSchema } from "@/lib/validations";
import { hashSenha } from "@/lib/auth";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

const SELECT = {
  id:true,nomeCompleto:true,setor:true,email:true,username:true,papel:true,
  temApp:true,ativo:true,ehGhost:true,fotoUrl:true,modeloHorarioId:true,criadoEm:true,atualizadoEm:true,
} as const;

export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  await exigirPapel("ADMIN","SUPORTE");
  const mostrarInativos = new URL(request.url).searchParams.get("inativos") === "1";
  const usuarios = await prisma.usuario.findMany({
    where: mostrarInativos ? {} : { ativo: true },
    orderBy: { criadoEm: "desc" },
    select: SELECT,
  });
  return NextResponse.json(usuarios);
});

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const admin = await exigirPapel("ADMIN");
  const corpo = await request.json();
  const dados = criarUsuarioSchema.parse(corpo);
  const existente = await prisma.usuario.findUnique({ where: { username: dados.username } });
  if (existente) throw new ApiError(409,"Já existe um usuário com esse nome de usuário.","USERNAME_DUPLICADO");
  const senhaHash = await hashSenha(dados.senha);
  const [usuario] = await prisma.$transaction(async tx => {
    const criado = await tx.usuario.create({
      data: {
        nomeCompleto: dados.nomeCompleto, setor: dados.setor, username: dados.username,
        senhaHash, email: dados.email || null, papel: dados.papel,
        temApp: dados.temApp, ativo: dados.ativo ?? true, ehGhost: dados.ehGhost ?? false,
        fotoUrl: dados.fotoUrl || null,
        modeloHorarioId: dados.modeloHorarioId || null,
      },
      select: SELECT,
    });
    if (dados.solicitacaoId) {
      await tx.solicitacaoAcesso.update({ where:{id:dados.solicitacaoId}, data:{status:"aprovada"} });
    }
    return [criado];
  });
  await registrarEvento({ tipo:"ACESSO_CRIADO", usuarioId:admin.id,
    detalhe:{usuarioCriadoId:usuario.id,papel:usuario.papel} });
  return NextResponse.json(usuario, { status: 201 });
});
