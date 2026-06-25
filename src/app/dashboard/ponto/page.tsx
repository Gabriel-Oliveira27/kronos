import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { PontoBoard } from "@/components/dashboard/PontoBoard";
import { Button } from "@/components/ui/Button";

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function moverMes(mesParam: string, delta: number): string {
  const [ano, mes] = mesParam.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeMes(mesParam: string): string {
  const [ano, mes] = mesParam.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function MeuPontoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  const params = await searchParams;
  const mes = params.mes && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : mesAtual();

  const [ano, m] = mes.split("-").map(Number);
  const mesStr = String(m).padStart(2, "0");
  const ultimoDia = new Date(ano, m, 0).getDate();
  // FIX TIMEZONE: janelas em UTC explícito (datas salvas em UTC midnight).
  const inicio = new Date(`${ano}-${mesStr}-01T00:00:00.000Z`);
  const fim = new Date(`${ano}-${mesStr}-${String(ultimoDia).padStart(2, "0")}T23:59:59.999Z`);

  const registros = await prisma.registroPonto.findMany({
    where: { usuarioId: usuario.id, deletadoEm: null, data: { gte: inicio, lte: fim } },
    orderBy: [{ data: "asc" }, { horarioReal: "asc" }],
  });

  const escalaDoMes = await prisma.escalaDia.findMany({
    where: { usuarioId: usuario.id, data: { gte: inicio, lte: fim } },
    select: { data: true, tipo: true },
  });

  const temApp = usuario.temApp;
  const mesAnterior = moverMes(mes, -1);
  const mesSeguinte = moverMes(mes, 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Meu ponto</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 first-letter:uppercase">
            {nomeMes(mes)} · registros e relatório de horas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/ponto?mes=${mesAnterior}`}>
            <Button variant="outline" size="sm">← Mês anterior</Button>
          </Link>
          <Link href="/dashboard/ponto">
            <Button variant="ghost" size="sm">Mês atual</Button>
          </Link>
          <Link href={`/dashboard/ponto?mes=${mesSeguinte}`}>
            <Button variant="outline" size="sm">Próximo mês →</Button>
          </Link>
        </div>
      </div>

      {temApp && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <p className="font-semibold">Sincronização ativa com o Kronos App</p>
          <p className="mt-0.5">Detectamos sincronização ativa com o Kronos App. Recomendamos utilizar as batidas registradas pelo aplicativo.</p>
        </div>
      )}

      <PontoBoard
        key={mes}
        registrosIniciais={JSON.parse(JSON.stringify(registros))}
        escalaDoMes={JSON.parse(JSON.stringify(escalaDoMes))}
        mesInicial={mes}
        jornadaDiaria={8}
      />
    </div>
  );
}
