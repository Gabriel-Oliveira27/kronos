import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { comTratamentoDeErro } from "@/lib/api";

export const runtime = "nodejs";

function primeiroNome(nome: string): string {
  return nome.split(" ")[0];
}
function fmt(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
function maisUmDia(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirPapel("CONFIGURADOR_ESCALA", "ADMIN");
  const meusSetores = usuario.setores.length > 0 ? usuario.setores : [usuario.setor];
  const filtroSetor =
    usuario.papel === "ADMIN"
      ? {}
      : { OR: [{ setor: { in: meusSetores } }, { setores: { hasSome: meusSetores } }] };

  const mesParam = new URL(request.url).searchParams.get("mes");
  const hoje = new Date();
  const mes =
    mesParam && /^\d{4}-\d{2}$/.test(mesParam)
      ? mesParam
      : `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const [ano, mesNum] = mes.split("-").map(Number);
  const mesStr = String(mesNum).padStart(2, "0");
  const ultimoDia = new Date(ano, mesNum, 0).getDate();
  const inicio = new Date(`${ano}-${mesStr}-01T00:00:00.000Z`);
  // +2 dias de folga para alcançar o domingo do último sábado (pode cair no mês seguinte).
  const fim = new Date(`${ano}-${mesStr}-${String(ultimoDia).padStart(2, "0")}T23:59:59.999Z`);
  fim.setUTCDate(fim.getUTCDate() + 2);

  const [usuarios, escalas] = await Promise.all([
    prisma.usuario.findMany({ where: filtroSetor, orderBy: { nomeCompleto: "asc" }, select: { id: true, nomeCompleto: true } }),
    prisma.escalaDia.findMany({
      where: { data: { gte: inicio, lte: fim }, ...(usuario.papel === "ADMIN" ? {} : { usuario: filtroSetor }) },
      select: { usuarioId: true, data: true, tipo: true },
    }),
  ]);

  const mapa = new Map<string, string>();
  for (const e of escalas) mapa.set(`${e.usuarioId}_${e.data.toISOString().slice(0, 10)}`, e.tipo);

  const porTipo = (data: string, tipo: string) =>
    usuarios.filter((u) => mapa.get(`${u.id}_${data}`) === tipo).map((u) => primeiroNome(u.nomeCompleto));

  // Sábados do mês
  const sabados: string[] = [];
  for (let d = 1; d <= ultimoDia; d++) {
    const iso = `${ano}-${mesStr}-${String(d).padStart(2, "0")}`;
    if (new Date(iso + "T12:00:00Z").getUTCDay() === 6) sabados.push(iso);
  }

  const linhas = sabados.map((sab) => {
    const dom = maisUmDia(sab);
    // Plantão (sáb e/ou dom) vem primeiro; Domingo efetivo em seguida —
    // ordem espelhada da aba "Visualização geral" do board.
    const plantao = usuarios
      .filter((u) => mapa.get(`${u.id}_${sab}`) === "PLANTAO" || mapa.get(`${u.id}_${dom}`) === "PLANTAO")
      .map((u) => primeiroNome(u.nomeCompleto));
    const domingoEfetivo = usuarios
      .filter((u) => mapa.get(`${u.id}_${dom}`) === "DOMINGO_EFETIVO")
      .map((u) => primeiroNome(u.nomeCompleto));
    return {
      sab,
      dom,
      plantao: [...plantao, ...domingoEfetivo],
      expediente: porTipo(sab, "NORMAL"),
      folga: porTipo(sab, "FOLGA"),
    };
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Escala ${mes}`);

  const header = ws.addRow(["Data", "Plantão FDS", "Sábado Expediente", "Sábado de Folga"]);
  header.font = { bold: true };
  header.alignment = { horizontal: "center" };
  header.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  });

  for (const l of linhas) {
    ws.addRow([
      `${fmt(l.sab)} e ${fmt(l.dom)}`,
      l.plantao.join(" / "),
      l.expediente.join(" / "),
      l.folga.join(" / "),
    ]);
  }

  ws.getColumn(1).width = 24;
  ws.getColumn(2).width = 28;
  ws.getColumn(3).width = 34;
  ws.getColumn(4).width = 28;

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="escala-${mes}.xlsx"`,
    },
  });
});
