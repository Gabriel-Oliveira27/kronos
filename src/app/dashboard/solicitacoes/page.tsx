import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { SolicitacoesBoard } from "@/components/dashboard/SolicitacoesBoard";

export default async function SolicitacoesPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  if (usuario.papel !== "ADMIN") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta área é exclusiva de administradores.
        </p>
      </div>
    );
  }

  const solicitacoes = await prisma.solicitacaoAcesso.findMany({ orderBy: { criadoEm: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Solicitações de acesso
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Analise os pedidos e crie o acesso manualmente quando aprovar.
        </p>
      </div>
      <SolicitacoesBoard solicitacoesIniciais={JSON.parse(JSON.stringify(solicitacoes))} />
    </div>
  );
}
