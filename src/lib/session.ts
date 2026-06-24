import "server-only";
import { cookies } from "next/headers";
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
 * Lê e valida o token de sessão do cookie. Rápido, sem ida ao banco — usado
 * pelo proxy.ts para roteamento grosso (logado? papel plausível?).
 */
export async function obterClaimsSessao(): Promise<SessionClaims | null> {
  const store = await cookies();
  return verificarSessao(store.get(COOKIE_NAME)?.value);
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
