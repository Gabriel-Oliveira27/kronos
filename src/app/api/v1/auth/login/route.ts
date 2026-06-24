import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verificarSenha, assinarSessao } from "@/lib/auth";
import { definirCookieSessao } from "@/lib/session";
import { registrarEvento } from "@/lib/log";
import { comTratamentoDeErro, ApiError } from "@/lib/api";

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const corpo = await request.json();
  const { username, senha } = loginSchema.parse(corpo);

  const usuario = await prisma.usuario.findUnique({ where: { username } });

  if (!usuario) {
    await registrarEvento({ tipo: "LOGIN_FALHA", detalhe: { username } });
    throw new ApiError(401, "Usuário ou senha inválidos.", "CREDENCIAIS_INVALIDAS");
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaValida) {
    await registrarEvento({ tipo: "LOGIN_FALHA", usuarioId: usuario.id, detalhe: { username } });
    throw new ApiError(401, "Usuário ou senha inválidos.", "CREDENCIAIS_INVALIDAS");
  }

  // Conta desativada não loga (checado só após a senha, para não revelar
  // quais usuários existem/estão inativos a quem não tem as credenciais).
  if (!usuario.ativo) {
    await registrarEvento({ tipo: "ACESSO_NEGADO", usuarioId: usuario.id, detalhe: { motivo: "conta_desativada" } });
    throw new ApiError(403, "Sua conta está desativada. Procure um administrador.", "CONTA_DESATIVADA");
  }

  const token = await assinarSessao({
    sub: usuario.id,
    username: usuario.username,
    papel: usuario.papel,
    nomeCompleto: usuario.nomeCompleto,
  });
  await definirCookieSessao(token);
  await registrarEvento({ tipo: "LOGIN_SUCESSO", usuarioId: usuario.id });

  // O `token` também vai no corpo para o app mobile (Expo/React Native), que
  // autentica por `Authorization: Bearer <token>` em vez de cookie. A web
  // ignora o campo e continua usando o cookie httpOnly definido acima.
  return NextResponse.json({
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    papel: usuario.papel,
    token,
  });
});
