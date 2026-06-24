import "server-only";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSessao, type SessionClaims } from "@/lib/auth";
import type { Usuario } from "@prisma/client";

export const COOKIE_NAME = "kronos_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function definirCookieSessao(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 dias, em sincronia com a expiração do JWT
  });
}

export async function limparCookieSessao() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Lê e valida o token de sessão. A web manda o JWT no cookie httpOnly; o app
 * mobile (Expo/React Native) manda em `Authorization: Bearer <token>`. Tentamos
 * o cookie primeiro e, se ausente, o header — assim a mesma checagem de sessão
 * serve aos dois clientes sem duplicar lógica. Rápido, sem ida ao banco.
 */
export async function obterClaimsSessao(): Promise<SessionClaims | null> {
  const store = await cookies();
  const tokenDoCookie = store.get(COOKIE_NAME)?.value;
  if (tokenDoCookie) return verificarSessao(tokenDoCookie);

  const cabecalhos = await headers();
  const autorizacao = cabecalhos.get("authorization");
  const tokenDoHeader = autorizacao?.toLowerCase().startsWith("bearer ")
    ? autorizacao.slice(7).trim()
    : undefined;
  return verificarSessao(tokenDoHeader);
}

export type UsuarioSemSenha = Omit<Usuario, "senhaHash">;

/**
 * Fonte da verdade para quem está logado: valida o token E busca o registro
 * atual no banco. Páginas/rotas que tomam decisões de autorização (e não só
 * de roteamento) devem usar esta função, não as claims do token isoladas —
 * assim uma mudança de papel feita pelo admin nunca fica "presa" atrás de um
 * token antigo ainda válido.
 */
export async function usuarioAtual(): Promise<UsuarioSemSenha | null> {
  const claims = await obterClaimsSessao();
  if (!claims) return null;

  const usuario = await prisma.usuario.findUnique({ where: { id: claims.sub } });
  if (!usuario) return null;
  // Usuário desativado é tratado como não autenticado em TODA a aplicação
  // (API e páginas) — a desativação tem efeito imediato, mesmo com token válido.
  if (!usuario.ativo) return null;

  const { senhaHash, ...resto } = usuario;
  return resto;
}
