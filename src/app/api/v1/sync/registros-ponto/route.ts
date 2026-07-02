import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { registroPontoSyncSchema } from "@/lib/validations";
import { comTratamentoDeErro } from "@/lib/api";

/**
 * GET ?cursor=ISO_DATE — devolve registros do próprio usuário alterados
 * desde o cursor (criados, atualizados OU excluídos: um soft delete também
 * atualiza atualizadoEm, então tombstones chegam no mesmo fluxo). A regra
 * dos 24h de recuperação na lixeira é responsabilidade do app mobile — a API
 * só expõe o estado atual, incluindo deletadoEm.
 */
export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const { searchParams } = new URL(request.url);
  const cursorParam = searchParams.get("cursor");
  const cursor = cursorParam ? new Date(cursorParam) : new Date(0);

  const registros = await prisma.registroPonto.findMany({
    where: { usuarioId: usuario.id, atualizadoEm: { gt: cursor } },
    orderBy: { atualizadoEm: "asc" },
    take: 500,
  });

  const proximoCursor = registros.at(-1)?.atualizadoEm ?? cursor;

  return NextResponse.json({ registros, proximoCursor });
});

/**
 * POST — upsert em lote dos registros locais do app mobile. O `usuarioId` é
 * sempre o do usuário autenticado (nunca confiamos no valor vindo do
 * cliente), então não é possível sincronizar batidas em nome de outra
 * pessoa.
 */
export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const corpo = await request.json();
  const { registros } = registroPontoSyncSchema.parse(corpo);

  if (registros.length === 0) {
    return NextResponse.json({ sincronizados: 0, registros: [], ignorados: [] });
  }

  // Se algum dos IDs enviados já existir e pertencer a OUTRO usuário, esse
  // item é ignorado — nunca permitimos que alguém altere um registro de
  // ponto de outra pessoa, mesmo conhecendo o id.
  const existentes = await prisma.registroPonto.findMany({
    where: { id: { in: registros.map((r) => r.id) } },
    select: { id: true, usuarioId: true },
  });
  const idsDeOutros = new Set(existentes.filter((e) => e.usuarioId !== usuario.id).map((e) => e.id));
  const validos = registros.filter((r) => !idsDeOutros.has(r.id));

  const resultados = await prisma.$transaction(
    validos.map((r) =>
      prisma.registroPonto.upsert({
        where: { id: r.id },
        create: {
          id: r.id,
          usuarioId: usuario.id,
          data: r.data,
          tipoEvento: r.tipoEvento,
          horarioReal: r.horarioReal || null,
          confirmado: r.confirmado,
        },
        update: {
          data: r.data,
          tipoEvento: r.tipoEvento,
          horarioReal: r.horarioReal || null,
          confirmado: r.confirmado,
          // O push só envia registros vivos (tombstones vão pelo DELETE), então
          // um upsert aqui também REVIVE um registro soft-deletado — é o que
          // permite restaurar uma batida pela lixeira do app (24h).
          deletadoEm: null,
        },
      })
    )
  );

  return NextResponse.json({
    sincronizados: resultados.length,
    registros: resultados,
    ignorados: Array.from(idsDeOutros),
  });
});
