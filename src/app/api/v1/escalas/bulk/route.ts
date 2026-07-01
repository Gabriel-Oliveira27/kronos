import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { escalasBulkSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";
import { inicioDoDia, fimDoDia } from "@/lib/utils";

const PAPEIS_QUE_EDITAM = ["CONFIGURADOR_ESCALA", "ADMIN"] as const;

/**
 * POST — aplica em lote as alterações da escala acumuladas no front (uma única
 * requisição em vez de uma por clique). `tipo: null` remove o dia.
 *
 * Recorte por setor: o CONFIGURADOR_ESCALA só pode alterar a escala de usuários
 * do PRÓPRIO setor; o ADMIN pode alterar qualquer um. Ao final devolve a escala
 * do mês inteiro (já no escopo que o board mostra) para o front sincronizar.
 */
export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const ehAdmin = usuario.papel === "ADMIN";
  if (!PAPEIS_QUE_EDITAM.includes(usuario.papel as (typeof PAPEIS_QUE_EDITAM)[number])) {
    throw ApiError.semPermissao("Só o configurador de escala ou um administrador pode editar escalas.");
  }

  const { mes, alteracoes } = escalasBulkSchema.parse(await request.json());

  if (alteracoes.length > 0) {
    // Valida o escopo: todos os usuários-alvo precisam existir e, para o
    // configurador, pertencer ao setor dele.
    const idsAlvo = [...new Set(alteracoes.map((a) => a.usuarioId))];
    const alvos = await prisma.usuario.findMany({
      where: { id: { in: idsAlvo } },
      select: { id: true, setor: true },
    });
    const mapaSetor = new Map(alvos.map((u) => [u.id, u.setor]));

    for (const id of idsAlvo) {
      if (!mapaSetor.has(id)) throw ApiError.naoEncontrado("Colaborador não encontrado.");
      if (!ehAdmin && mapaSetor.get(id) !== usuario.setor) {
        throw ApiError.semPermissao("Você só pode alterar a escala de colaboradores do seu setor.");
      }
    }

    // Aplica tudo numa transação. Cada (usuário, dia) tem um único tipo final,
    // então basta upsert-por-dia ou remoção.
    await prisma.$transaction(async (tx) => {
      for (const alt of alteracoes) {
        const existente = await tx.escalaDia.findFirst({
          where: { usuarioId: alt.usuarioId, data: { gte: inicioDoDia(alt.data), lte: fimDoDia(alt.data) } },
        });
        if (alt.tipo === null) {
          if (existente) await tx.escalaDia.delete({ where: { id: existente.id } });
          continue;
        }
        if (existente) {
          await tx.escalaDia.update({ where: { id: existente.id }, data: { tipo: alt.tipo } });
        } else {
          await tx.escalaDia.create({
            data: { usuarioId: alt.usuarioId, data: alt.data, tipo: alt.tipo, criadoPorId: usuario.id },
          });
        }
      }
    });

    await registrarEvento({
      tipo: "ESCALA_ALTERADA",
      usuarioId: usuario.id,
      detalhe: { mes, quantidade: alteracoes.length, acao: "bulk" },
    });
  }

  // Devolve a escala do mês no mesmo escopo que o board exibe.
  const [ano, numeroMes] = mes.split("-").map(Number);
  const mesStr = String(numeroMes).padStart(2, "0");
  const ultimoDia = new Date(ano, numeroMes, 0).getDate();
  const inicio = new Date(`${ano}-${mesStr}-01T00:00:00.000Z`);
  const fim = new Date(`${ano}-${mesStr}-${String(ultimoDia).padStart(2, "0")}T23:59:59.999Z`);

  const escalas = await prisma.escalaDia.findMany({
    where: {
      data: { gte: inicio, lte: fim },
      ...(ehAdmin ? {} : { usuario: { setor: usuario.setor } }),
    },
    select: { id: true, usuarioId: true, data: true, tipo: true, observacao: true },
  });

  return NextResponse.json({ escalas });
});
