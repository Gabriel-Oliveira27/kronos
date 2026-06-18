import "server-only";
import type { Papel } from "@prisma/client";
import { usuarioAtual, type UsuarioSemSenha } from "@/lib/session";
import { ApiError } from "@/lib/api";

/**
 * Exige um usuário autenticado E com registro válido no banco. Usado em toda
 * rota de API que não é pública. Lança ApiError (401) se não houver sessão.
 */
export async function exigirUsuario(): Promise<UsuarioSemSenha> {
  const usuario = await usuarioAtual();
  if (!usuario) throw ApiError.naoAutenticado();
  return usuario;
}

/**
 * Exige que o usuário autenticado tenha um dos papéis informados. A checagem
 * de papel é sempre contra o registro atual do banco (via usuarioAtual), não
 * contra o token — então uma mudança de papel feita pelo admin tem efeito
 * imediato em chamadas de API, mesmo que o token antigo ainda seja válido.
 */
export async function exigirPapel(...papeisPermitidos: Papel[]): Promise<UsuarioSemSenha> {
  const usuario = await exigirUsuario();
  if (!papeisPermitidos.includes(usuario.papel)) {
    throw ApiError.semPermissao();
  }
  return usuario;
}
