import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { PontoBoard } from "@/components/dashboard/PontoBoard";

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

export default async function MeuPontoPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  const mes = mesAtual();
  const [ano, m] = mes.split("-").map(Number);
  const mesStr = String(m).padStart(2,"0");
  const ultimoDia = new Date(ano, m, 0).getDate();
  const inicio = new Date(`${ano}-${mesStr}-01T00:00:00.000Z`);
  const fim = new Date(`${ano}-${mesStr}-${String(ultimoDia).padStart(2,"0")}T23:59:59.999Z`);

  const registros = await prisma.registroPonto.findMany({
    where: { usuarioId: usuario.id, deletadoEm: null, data: { gte: inicio, lte: fim } },
    orderBy: [{ data: "asc" }, { horarioReal: "asc" }],
  });

  const escalaDoMes = await prisma.escalaDia.findMany({
    where: { usuarioId: usuario.id, data: { gte: inicio, lte: fim } },
    select: { data: true, tipo: true },
  });

  const temApp = usuario.temApp;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Meu ponto</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Registros de ponto e relatório de horas.</p>
      </div>
      {temApp && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <p className="font-semibold">Sincronização ativa com o Kronos App</p>
          <p className="mt-0.5">Detectamos sincronização ativa com o Kronos App. Recomendamos utilizar as batidas registradas pelo aplicativo.</p>
        </div>
      )}
      <PontoBoard
        registrosIniciais={JSON.parse(JSON.stringify(registros))}
        escalaDoMes={JSON.parse(JSON.stringify(escalaDoMes))}
        mesInicial={mes}
        jornadaDiaria={8}
      />
    </div>
  );
}
