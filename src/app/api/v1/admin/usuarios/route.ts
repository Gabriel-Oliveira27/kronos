import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { criarUsuarioSchema } from "@/lib/validations";
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

// Visível para ADMIN (gestão completa) e SUPORTE (só leitura, sem ações
// sensíveis — a restrição de ação fica nas rotas de escrita, não aqui).
export const GET = comTratamentoDeErro(async () => {
  await exigirPapel("ADMIN", "SUPORTE");

  const usuarios = await prisma.usuario.findMany({
    orderBy: { criadoEm: "desc" },
    select: SELECAO_SEGURA,
  });

  return NextResponse.json(usuarios);
});

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const admin = await exigirPapel("ADMIN");
  const corpo = await request.json();
  const dados = criarUsuarioSchema.parse(corpo);

  const usernameExistente = await prisma.usuario.findUnique({ where: { username: dados.username } });
  if (usernameExistente) {
    throw new ApiError(409, "Já existe um usuário com esse nome de usuário.", "USERNAME_DUPLICADO");
  }

  const senhaHash = await hashSenha(dados.senha);

  const [usuario] = await prisma.$transaction(async (tx) => {
    const criado = await tx.usuario.create({
      data: {
        nomeCompleto: dados.nomeCompleto,
        setor: dados.setor,
        username: dados.username,
        senhaHash,
        email: dados.email || null,
        papel: dados.papel,
        temApp: dados.temApp,
        fotoUrl: dados.fotoUrl || null,
      },
      select: SELECAO_SEGURA,
    });

    if (dados.solicitacaoId) {
      await tx.solicitacaoAcesso.update({
        where: { id: dados.solicitacaoId },
        data: { status: "aprovada" },
      });
    }

    return [criado];
  });

  await registrarEvento({
    tipo: "ACESSO_CRIADO",
    usuarioId: admin.id,
    detalhe: { usuarioCriadoId: usuario.id, papel: usuario.papel },
  });

  return NextResponse.json(usuario, { status: 201 });
});
