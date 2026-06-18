import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { formatarData } from "@/lib/utils";

async function proximaData(usuarioId: string, tipo: "PLANTAO" | "HOME_OFFICE" | "FOLGA") {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const escala = await prisma.escalaDia.findFirst({
    where: { usuarioId, tipo, data: { gte: hoje } },
    orderBy: { data: "asc" },
  });

  return escala?.data ?? null;
}

function CardProximo({ titulo, data, tom }: { titulo: string; data: Date | null; tom: string }) {
  return (
    <Card>
      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {titulo}
      </p>
      {data ? (
        <p className={`mt-2 font-display text-2xl font-semibold ${tom}`}>{formatarData(data)}</p>
      ) : (
        <p className="mt-2 font-display text-xl font-medium text-slate-400 dark:text-slate-500">
          Indefinido / aguardando
        </p>
      )}
    </Card>
  );
}

export default async function DashboardHomePage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  const [proximoPlantao, proximoHomeOffice, proximaFolga] = await Promise.all([
    proximaData(usuario.id, "PLANTAO"),
    proximaData(usuario.id, "HOME_OFFICE"),
    proximaData(usuario.id, "FOLGA"),
  ]);

  const solicitacoesPendentes =
    usuario.papel === "ADMIN"
      ? await prisma.solicitacaoAcesso.count({ where: { status: "pendente" } })
      : 0;

  let metricas: { totalUsuarios: number; usuariosComApp: number; batidasNoMes: number } | null = null;
  if (usuario.papel === "ADMIN") {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [totalUsuarios, usuariosComApp, batidasNoMes] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { temApp: true } }),
      prisma.registroPonto.count({ where: { data: { gte: inicioMes }, deletadoEm: null } }),
    ]);
    metricas = { totalUsuarios, usuariosComApp, batidasNoMes };
  }

  const primeiroNome = usuario.nomeCompleto.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Olá, {primeiroNome}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sua escala a partir de hoje.</p>
      </div>

      {usuario.papel === "ADMIN" && solicitacoesPendentes > 0 && (
        <Link
          href="/dashboard/solicitacoes"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          {solicitacoesPendentes} solicitação(ões) de acesso aguardando análise →
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <CardProximo titulo="Próximo plantão" data={proximoPlantao} tom="text-brand-blue" />
        <CardProximo titulo="Próximo home office" data={proximoHomeOffice} tom="text-brand-green-dark dark:text-brand-green" />
        <CardProximo titulo="Próxima folga" data={proximaFolga} tom="text-amber-600 dark:text-amber-400" />
      </div>

      {metricas && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Usuários ativos
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">
              {metricas.totalUsuarios}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {metricas.usuariosComApp} com app mobile
            </p>
          </Card>
          <Card>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Batidas neste mês
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">
              {metricas.batidasNoMes}
            </p>
          </Card>
          <Card>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Solicitações pendentes
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">
              {solicitacoesPendentes}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
