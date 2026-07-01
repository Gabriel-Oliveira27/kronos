import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { comTratamentoDeErro } from "@/lib/api";

/**
 * Lista de colaboradores para o app mobile montar o seletor de escala. Restrito
 * a quem edita escala (CONFIGURADOR_ESCALA / ADMIN) — espelha quem pode editar
 * via `POST /escalas`. Retorna o mínimo necessário (sem dados sensíveis).
 */
export const GET = comTratamentoDeErro(async () => {
  const usuario = await exigirPapel("CONFIGURADOR_ESCALA", "ADMIN");

  // Configurador só enxerga colaboradores dos próprios setores; admin vê todos.
  const meusSetores = usuario.setores.length > 0 ? usuario.setores : [usuario.setor];
  const colaboradores = await prisma.usuario.findMany({
    where: {
      ativo: true,
      ...(usuario.papel === "ADMIN"
        ? {}
        : { OR: [{ setor: { in: meusSetores } }, { setores: { hasSome: meusSetores } }] }),
    },
    orderBy: { nomeCompleto: "asc" },
    select: { id: true, nomeCompleto: true, setor: true },
  });

  return NextResponse.json(colaboradores);
});
