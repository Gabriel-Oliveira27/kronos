import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Tipos de evento gravados em LogEvento. Mantidos como union de strings (não
 * enum do Prisma) de propósito: o app mobile e versões futuras da API podem
 * querer registrar tipos novos sem precisar de uma migração de banco.
 */
export type TipoLog =
  | "LOGIN_SUCESSO"
  | "LOGIN_FALHA"
  | "LOGOUT"
  | "ACESSO_NEGADO"
  | "ERRO_API"
  | "ERRO_BANCO"
  | "SOLICITACAO_CRIADA"
  | "ACESSO_CRIADO"
  | "ACESSO_EDITADO"
  | "SOLICITACAO_REJEITADA"
  | "ESCALA_ALTERADA"
  | "CONHECIMENTO_EXCLUIDO"
  | "PONTO_EXCLUIDO"
  | "UPLOAD_FOTO_FALHA"
  | "CONFIG_APP_ALTERADA"
  | "LOGIN_BLOQUEADO"
  | "ESCALA_PUBLICA_FALHA"
  | "ESCALA_PUBLICA_BLOQUEADA";

interface RegistrarEventoInput {
  tipo: TipoLog;
  usuarioId?: string | null;
  detalhe?: Record<string, unknown>;
}

/**
 * Grava um evento em LogEvento. Nunca lança — um problema ao logar não pode
 * derrubar a requisição original. Falhas de gravação do próprio log vão só
 * para o console (não tem pra onde "escalar" mais).
 */
export async function registrarEvento({ tipo, usuarioId, detalhe }: RegistrarEventoInput): Promise<void> {
  try {
    await prisma.logEvento.create({
      data: {
        tipo,
        usuarioId: usuarioId ?? null,
        // JSON.parse(JSON.stringify()) converte Record<string, unknown> para um
        // valor JSON puro que o Prisma 7 aceita para o campo Json? — sem isso
        // o TypeScript do Vercel (que usa os tipos gerados do schema real) falha
        // com "not assignable to type NullableJsonNullValueInput | InputJsonValue".
        detalhe: JSON.parse(JSON.stringify(detalhe ?? null)),
      },
    });
  } catch (err) {
    console.error("[kronos] falha ao gravar log de evento:", tipo, err);
  }
}
