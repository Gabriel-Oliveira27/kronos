import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { formatarData, horarioDoTipo } from "@/lib/utils";

async function proximaData(usuarioId: string, tipo: "PLANTAO" | "HOME_OFFICE" | "FOLGA") {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const escala = await prisma.escalaDia.findFirst({
    where: { usuarioId, tipo, data: { gte: hoje } },
    orderBy: { data: "asc" },
  });
  return escala?.data ?? null;
}

function CardProximo({ titulo, data, tom, sub }: { titulo: string; data: Date | null; tom: string; sub?: string }) {
  return (
    <Card>
      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">{titulo}</p>
      {data ? (
        <>
          <p className={`mt-2 font-display text-2xl font-semibold ${tom}`}>{formatarData(data)}</p>
          {sub && <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        </>
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

  // Cards de próxima escala apenas para setor "Suporte" (item 9)
  const ehSuporte = usuario.setor?.toLowerCase() === "suporte";

  const [proximoPlantao, proximoHomeOffice, proximaFolga] = ehSuporte
    ? await Promise.all([
        proximaData(usuario.id, "PLANTAO"),
        proximaData(usuario.id, "HOME_OFFICE"),
        proximaData(usuario.id, "FOLGA"),
      ])
    : [null, null, null];

  const solicitacoesPendentes =
    usuario.papel === "ADMIN"
      ? await prisma.solicitacaoAcesso.count({ where: { status: "pendente" } })
      : 0;

  let metricas: { totalUsuarios: number; usuariosAtivos: number; usuariosComApp: number; batidasNoMes: number } | null = null;
  if (usuario.papel === "ADMIN") {
    const inicioMes = new Date();
    inicioMes.setUTCDate(1); inicioMes.setUTCHours(0, 0, 0, 0);
    const [totalUsuarios, usuariosAtivos, usuariosComApp, batidasNoMes] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { ativo: true } }),
      prisma.usuario.count({ where: { temApp: true } }),
      prisma.registroPonto.count({ where: { data: { gte: inicioMes }, deletadoEm: null } }),
    ]);
    metricas = { totalUsuarios, usuariosAtivos, usuariosComApp, batidasNoMes };
  }

  const primeiroNome = usuario.nomeCompleto.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Olá, {primeiroNome} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {ehSuporte ? "Sua escala a partir de hoje." : "Bem-vindo ao Kronos."}
        </p>
      </div>

      {usuario.papel === "ADMIN" && solicitacoesPendentes > 0 && (
        <Link href="/dashboard/solicitacoes"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {solicitacoesPendentes} solicitação(ões) de acesso aguardando análise →
        </Link>
      )}

      {/* Cards de escala — apenas setor Suporte */}
      {ehSuporte && (
        <div className="grid gap-4 sm:grid-cols-3">
          <CardProximo titulo="Próximo plantão"    data={proximoPlantao}    tom="text-brand-blue" />
          <CardProximo titulo="Próximo home office" data={proximoHomeOffice} tom="text-brand-green-dark dark:text-brand-green" sub={horarioDoTipo("HOME_OFFICE") ?? undefined} />
          <CardProximo titulo="Próxima folga"       data={proximaFolga}      tom="text-amber-600 dark:text-amber-400" />
        </div>
      )}

      {/* Métricas admin */}
      {metricas && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Usuários cadastrados", valor: metricas.totalUsuarios, sub: `${metricas.usuariosAtivos} ativos` },
            { label: "Com app mobile",       valor: metricas.usuariosComApp },
            { label: "Batidas neste mês",    valor: metricas.batidasNoMes },
            { label: "Solicitações pendentes", valor: solicitacoesPendentes },
          ].map(({ label, valor, sub }) => (
            <Card key={label}>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">{valor}</p>
              {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Botão download do app */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-brand-blue">
                <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Kronos App</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bata o ponto direto do celular</p>
            </div>
          </div>
          <Link href="/dashboard/kronos-app"
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark transition-colors">
            Baixar app →
          </Link>
        </div>
      </div>
    </div>
  );
}
