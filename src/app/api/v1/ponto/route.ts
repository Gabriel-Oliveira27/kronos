import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { registroPontoWebSchema } from "@/lib/validations";
import { comTratamentoDeErro } from "@/lib/api";
import { inicioDoDia, fimDoDia } from "@/lib/utils";

export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const { searchParams } = new URL(request.url);
  const dataParam = searchParams.get("data");
  const mesParam  = searchParams.get("mes"); // yyyy-mm

  let where: Prisma.RegistroPontoWhereInput = { usuarioId: usuario.id, deletadoEm: null };

  if (dataParam) {
    const d = new Date(dataParam + "T00:00:00.000Z");
    where = { ...where, data: { gte: inicioDoDia(d), lte: fimDoDia(d) } };
  } else if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [ano, mes] = mesParam.split("-").map(Number);
    const mesStr = String(mes).padStart(2,"0");
    const ultimo = new Date(ano, mes, 0).getDate();
    where = { ...where, data: {
      gte: new Date(`${ano}-${mesStr}-01T00:00:00.000Z`),
      lte: new Date(`${ano}-${mesStr}-${String(ultimo).padStart(2,"0")}T23:59:59.999Z`),
    }};
  }

  const registros = await prisma.registroPonto.findMany({
    where,
    orderBy: [{ data: "asc" }, { horarioReal: "asc" }],
  });
  return NextResponse.json(registros);
});

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const dados = registroPontoWebSchema.parse(await request.json());
  const registro = await prisma.registroPonto.create({
    data: {
      usuarioId: usuario.id, data: dados.data,
      tipoEvento: dados.tipoEvento, horarioReal: dados.horarioReal,
      confirmado: true, origem: "web",
    },
  });
  return NextResponse.json(registro, { status: 201 });
});
