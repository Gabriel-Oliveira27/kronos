import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verificarSenha, assinarSessao } from "@/lib/auth";
import { definirCookieSessao } from "@/lib/session";
import { registrarEvento } from "@/lib/log";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { contarEventos, obterIp } from "@/lib/ratelimit";

// Rate limit: até 10 falhas de login por IP a cada 10 minutos.
const JANELA_LOGIN_MS = 10 * 60 * 1000;
const MAX_FALHAS_LOGIN = 10;

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const ip = obterIp(request);

  // Trava de brute-force por IP (conta falhas recentes no LogEvento).
  const falhasRecentes = await contarEventos("LOGIN_FALHA", "ip", ip, JANELA_LOGIN_MS);
  if (falhasRecentes >= MAX_FALHAS_LOGIN) {
    await registrarEvento({ tipo: "LOGIN_BLOQUEADO", detalhe: { ip } });
    throw new ApiError(429, "Muitas tentativas de login. Tente novamente em alguns minutos.", "MUITAS_TENTATIVAS");
  }

  const corpo = await request.json();
  const { username, senha } = loginSchema.parse(corpo);

  const usuario = await prisma.usuario.findUnique({ where: { username } });

  if (!usuario) {
    await registrarEvento({ tipo: "LOGIN_FALHA", detalhe: { username, ip } });
    throw new ApiError(401, "Usuário ou senha inválidos.", "CREDENCIAIS_INVALIDAS");
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaValida) {
    await registrarEvento({ tipo: "LOGIN_FALHA", usuarioId: usuario.id, detalhe: { username, ip } });
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
