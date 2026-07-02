import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { modeloHorarioSchema } from "@/lib/validations";
import { comTratamentoDeErro } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

export const GET = comTratamentoDeErro(async () => {
  await exigirPapel("CONFIGURADOR_ESCALA","ADMIN","SUPORTE");
  const modelos = await prisma.modeloHorario.findMany({
    orderBy: { criadoEm: "desc" },
    include: { _count: { select: { usuarios: true } } },
  });
  return NextResponse.json(modelos);
});

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirPapel("CONFIGURADOR_ESCALA","ADMIN");
  const dados = modeloHorarioSchema.parse(await request.json());
  const modelo = await prisma.modeloHorario.create({
    data: {
      nome: dados.nome, descricao: dados.descricao || null,
      horasSemanais: dados.horasSemanais, jornadaDiaria: dados.jornadaDiaria,
      jornadaPlantao: dados.jornadaPlantao,
      configuracao: dados.configuracao ? JSON.parse(JSON.stringify(dados.configuracao)) : null,
      criadoPorId: usuario.id,
    },
  });
  await registrarEvento({
    tipo: "MODELO_HORARIO_CRIADO",
    usuarioId: usuario.id,
    detalhe: { modeloId: modelo.id, nome: modelo.nome, horasSemanais: modelo.horasSemanais, jornadaDiaria: modelo.jornadaDiaria, jornadaPlantao: modelo.jornadaPlantao },
  });
  return NextResponse.json(modelo, { status: 201 });
});
