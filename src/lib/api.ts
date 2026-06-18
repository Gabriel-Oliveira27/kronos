import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { registrarEvento } from "@/lib/log";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "ERRO") {
    super(message);
    this.status = status;
    this.code = code;
  }

  static naoAutenticado(msg = "Você precisa estar autenticado.") {
    return new ApiError(401, msg, "NAO_AUTENTICADO");
  }

  static semPermissao(msg = "Você não tem permissão para fazer isso.") {
    return new ApiError(403, msg, "SEM_PERMISSAO");
  }

  static naoEncontrado(msg = "Registro não encontrado.") {
    return new ApiError(404, msg, "NAO_ENCONTRADO");
  }
}

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

/**
 * Envolve um route handler com tratamento de erro padronizado:
 * - ApiError vira a resposta JSON com o status/código que ela já carrega.
 * - ZodError vira 400 com os detalhes de validação.
 * - Qualquer outro erro é logado em LogEvento (ERRO_API) e respondido como
 *   500 genérico — detalhes de erro inesperado não vão para o cliente.
 *
 * Genérico sobre a TUPLA de argumentos (não um único tipo de elemento) —
 * isso é o que permite o mesmo wrapper funcionar tanto em rotas sem
 * parâmetros dinâmicos (`(request) => ...`) quanto em rotas com
 * `(request, { params }) => ...`, mantendo o tipo exato que o Next.js espera
 * para cada uma.
 */
export function comTratamentoDeErro<Args extends unknown[]>(handler: RouteHandler<Args>): RouteHandler<Args> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos.", code: "VALIDACAO", detalhes: err.issues },
          { status: 400 }
        );
      }

      console.error("[kronos] erro inesperado em rota da API:", err);
      await registrarEvento({
        tipo: "ERRO_API",
        detalhe: { mensagem: err instanceof Error ? err.message : String(err) },
      });

      return NextResponse.json(
        { error: "Erro interno. Tente novamente em alguns instantes.", code: "ERRO_INTERNO" },
        { status: 500 }
      );
    }
  };
}
