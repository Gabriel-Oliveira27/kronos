import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { escalaDiaSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";
import { inicioDoDia, fimDoDia } from "@/lib/utils";

const PAPEIS_QUE_EDITAM = ["CONFIGURADOR_ESCALA", "ADMIN"] as const;

/**
 * GET — usuário comum só lê a própria escala (usuarioId é sempre forçado
 * para o próprio id, mesmo que outro seja pedido na query). Configurador e
 * admin podem ver a equipe inteira num intervalo de datas (para o
 * calendário) ou filtrar por usuarioId específico.
 */
export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const { searchParams } = new URL(request.url);
  const podeVerEquipe = PAPEIS_QUE_EDITAM.includes(usuario.papel as (typeof PAPEIS_QUE_EDITAM)[number]);

  const usuarioIdFiltro = podeVerEquipe ? searchParams.get("usuarioId") ?? undefined : usuario.id;
  const inicioParam = searchParams.get("inicio");
  const fimParam = searchParams.get("fim");

  const escalas = await prisma.escalaDia.findMany({
    where: {
      ...(usuarioIdFiltro ? { usuarioId: usuarioIdFiltro } : {}),
      ...(inicioParam || fimParam
        ? {
            data: {
              ...(inicioParam ? { gte: inicioDoDia(new Date(inicioParam)) } : {}),
              ...(fimParam ? { lte: fimDoDia(new Date(fimParam)) } : {}),
            },
          }
        : {}),
    },
    orderBy: { data: "asc" },
    include: { usuario: { select: { id: true, nomeCompleto: true, setor: true, temApp: true } } },
  });

  return NextResponse.json(escalas);
});

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  if (!PAPEIS_QUE_EDITAM.includes(usuario.papel as (typeof PAPEIS_QUE_EDITAM)[number])) {
    throw ApiError.semPermissao("Só o configurador de escala ou um administrador pode editar escalas.");
  }

  const corpo = await request.json();
  const dados = escalaDiaSchema.parse(corpo);

  const usuarioDestino = await prisma.usuario.findUnique({ where: { id: dados.usuarioId } });
  if (!usuarioDestino) throw ApiError.naoEncontrado("Colaborador não encontrado.");

  // Recorte por setor: configurador só altera quem compartilha setor com ele.
  if (usuario.papel !== "ADMIN") {
    const meusSetores = usuario.setores.length > 0 ? usuario.setores : [usuario.setor];
    const setoresAlvo = usuarioDestino.setores.length > 0 ? usuarioDestino.setores : [usuarioDestino.setor];
    if (!setoresAlvo.some((s) => meusSetores.includes(s))) {
      throw ApiError.semPermissao("Você só pode alterar a escala de colaboradores do seu setor.");
    }
  }

  // Um dia = um tipo de escala. Se já existir um registro para esse usuário
  // nesse dia, atualizamos em vez de duplicar.
  const existente = await prisma.escalaDia.findFirst({
    where: {
      usuarioId: dados.usuarioId,
      data: { gte: inicioDoDia(dados.data), lte: fimDoDia(dados.data) },
    },
  });

  // Regra de sábado: quem já está de folga ou home office no sábado não pode
  // ser escalado para trabalhar presencialmente (Normal/Plantão).
  if (
    dados.data.getUTCDay() === 6 &&
    (dados.tipo === "NORMAL" || dados.tipo === "PLANTAO") &&
    (existente?.tipo === "FOLGA" || existente?.tipo === "HOME_OFFICE")
  ) {
    throw new ApiError(
      409,
      "Este colaborador está de folga ou home office neste sábado e não pode ser escalado para trabalhar presencialmente.",
      "SABADO_INDISPONIVEL"
    );
  }

  const escala = existente
    ? await prisma.escalaDia.update({
        where: { id: existente.id },
        data: { tipo: dados.tipo, etiquetaId: dados.etiquetaId ?? null, observacao: dados.observacao || null },
      })
    : await prisma.escalaDia.create({
        data: {
          usuarioId: dados.usuarioId,
          data: dados.data,
          tipo: dados.tipo,
          etiquetaId: dados.etiquetaId ?? null,
          observacao: dados.observacao || null,
          criadoPorId: usuario.id,
        },
      });

  await registrarEvento({
    tipo: "ESCALA_ALTERADA",
    usuarioId: usuario.id,
    detalhe: {
      escalaId: escala.id,
      usuarioDestino: dados.usuarioId,
      tipo: dados.tipo,
      mudancas: [{
        usuario: usuarioDestino.nomeCompleto,
        data: dados.data.toISOString().slice(0, 10),
        antes: existente?.tipo ?? null,
        depois: dados.tipo,
      }],
    },
  });

  return NextResponse.json(escala, { status: existente ? 200 : 201 });
});
