import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Papel } from "@prisma/client";

const SALT_ROUNDS = 10;
const TOKEN_TTL = "7d";

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export interface SessionClaims extends JWTPayload {
  sub: string;
  username: string;
  papel: Papel;
  nomeCompleto: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET não está definido (ou é muito curto). Defina uma string aleatória longa nas variáveis de ambiente."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function assinarSessao(claims: Omit<SessionClaims, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecretKey());
}

/**
 * Verifica e decodifica o token de sessão. Retorna `null` em qualquer
 * cenário de token ausente, expirado ou inválido — nunca lança erro para
 * quem chama, para simplificar os pontos de uso (proxy, layouts, rotas).
 */
export async function verificarSessao(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionClaims;
  } catch {
    return null;
  }
}
