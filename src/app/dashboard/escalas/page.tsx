import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { EscalasBoard } from "@/components/dashboard/EscalasBoard";
import { Button } from "@/components/ui/Button";

function diasDoMes(ano: number, mes: number): string[] {
  const ultimo = new Date(ano, mes, 0).getDate();
  return Array.from({ length: ultimo }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    const m = String(mes).padStart(2, "0");
    return `${ano}-${m}-${d}`;
  });
}

function nomeMes(ano: number, mes: number): string {
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function moverMes(mesParam: string, delta: number): string {
  const [ano, mes] = mesParam.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  const novoAno = d.getFullYear();
  const novoMes = d.getMonth() + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

export default async function EscalasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  if (usuario.papel !== "CONFIGURADOR_ESCALA" && usuario.papel !== "ADMIN") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta área é exclusiva do configurador de escala e de administradores.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const hoje = new Date();
  const mesDefault = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const mesAtivo = params.mes && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : mesDefault;

  const [anoAtivo, mesNumero] = mesAtivo.split("-").map(Number);

  // ─── FIX TIMEZONE ────────────────────────────────────────────────────────
  // new Date(ano, mes-1, dia) usa o horário LOCAL do servidor.  No Brasil
  // (UTC-3) isso cria um Date que é 3h à frente em UTC comparado às datas
  // armazenadas, que foram salvas via z.coerce.date("YYYY-MM-DD") e portanto
  // ficam em UTC midnight.  Resultado: a query pula tudo que está em 00:00Z
  // porque o início da janela já está em 03:00Z.
  //
  // Solução: montar o início/fim direto em UTC usando strings ISO explícitas.
  const mesStr = String(mesNumero).padStart(2, "0");
  const ultimoDia = new Date(anoAtivo, mesNumero, 0).getDate();
  const ultimoDiaStr = String(ultimoDia).padStart(2, "0");
  const inicio = new Date(`${anoAtivo}-${mesStr}-01T00:00:00.000Z`);
  const fim = new Date(`${anoAtivo}-${mesStr}-${ultimoDiaStr}T23:59:59.999Z`);
  // ─────────────────────────────────────────────────────────────────────────

  const dias = diasDoMes(anoAtivo, mesNumero);

  const mesAnterior = moverMes(mesAtivo, -1);
  const mesSeguinte = moverMes(mesAtivo, 1);

  // Recorte por setor: o configurador só vê/edita a escala dos próprios
  // setores (multi-setor); o admin vê todos.
  const ehAdmin = usuario.papel === "ADMIN";
  const meusSetores = usuario.setores.length > 0 ? usuario.setores : [usuario.setor];
  const filtroSetor = ehAdmin
    ? {}
    : { OR: [{ setor: { in: meusSetores } }, { setores: { hasSome: meusSetores } }] };

  // Janela estendida em +1 dia: o domingo do último sábado do mês pode cair no
  // mês seguinte e é necessário para o par de plantão / visualização geral.
  const fimEstendido = new Date(fim);
  fimEstendido.setUTCDate(fimEstendido.getUTCDate() + 1);

  const [usuarios, escalas, setoresRegistros] = await Promise.all([
    prisma.usuario.findMany({
      where: filtroSetor,
      orderBy: { nomeCompleto: "asc" },
      select: {
        id: true, nomeCompleto: true, setor: true, setores: true, temApp: true, fotoUrl: true,
        modeloHorario: { select: { jornadaPlantao: true } },
      },
    }),
    prisma.escalaDia.findMany({
      where: { data: { gte: inicio, lte: fimEstendido }, ...(ehAdmin ? {} : { usuario: filtroSetor }) },
      select: { id: true, usuarioId: true, data: true, tipo: true, etiquetaId: true, observacao: true },
    }),
    prisma.setor.findMany({ select: { nome: true, etiquetas: true, palavraSecretaHash: true } }),
  ]);

  // Etiquetas por setor (nome → lista). Setores sem registro/JSON usam o padrão.
  const etiquetasPorSetor: Record<string, unknown> = {};
  for (const s of setoresRegistros) etiquetasPorSetor[s.nome] = s.etiquetas;

  const setorPrincipalTemPalavra = !!setoresRegistros.find((s) => s.nome === usuario.setor)?.palavraSecretaHash;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold capitalize text-slate-900 dark:text-white">
            {nomeMes(anoAtivo, mesNumero)}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {ehAdmin ? "Escala de todos os setores" : `Escala de ${meusSetores.join(", ")}`} — {usuarios.length} colaborador(es)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/escalas?mes=${mesAnterior}`}>
            <Button variant="outline" size="sm">← Mês anterior</Button>
          </Link>
          <Link href="/dashboard/escalas">
            <Button variant="ghost" size="sm">Mês atual</Button>
          </Link>
          <Link href={`/dashboard/escalas?mes=${mesSeguinte}`}>
            <Button variant="outline" size="sm">Próximo mês →</Button>
          </Link>
        </div>
      </div>

      <EscalasBoard
        key={mesAtivo}
        usuarios={JSON.parse(JSON.stringify(usuarios))}
        escalasIniciais={JSON.parse(JSON.stringify(escalas))}
        diasDoMes={dias}
        mesAtivo={mesAtivo}
        ehAdmin={ehAdmin}
        meusSetores={ehAdmin ? [] : meusSetores}
        setorTemPalavra={setorPrincipalTemPalavra}
        etiquetasPorSetorJson={JSON.parse(JSON.stringify(etiquetasPorSetor))}
      />
    </div>
  );
}
