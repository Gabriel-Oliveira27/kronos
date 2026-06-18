import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { FiltroTipoLog } from "@/components/dashboard/FiltroTipoLog";
import { formatarDataHora } from "@/lib/utils";

const TOM_POR_TIPO: Record<string, "green" | "red" | "amber" | "blue" | "slate"> = {
  LOGIN_SUCESSO: "green",
  LOGIN_FALHA: "red",
  LOGOUT: "slate",
  ACESSO_NEGADO: "red",
  ERRO_API: "red",
  ERRO_BANCO: "red",
  UPLOAD_FOTO_FALHA: "red",
  SOLICITACAO_REJEITADA: "amber",
  SOLICITACAO_CRIADA: "blue",
  ACESSO_CRIADO: "green",
  ACESSO_EDITADO: "blue",
  ESCALA_ALTERADA: "blue",
  CONHECIMENTO_EXCLUIDO: "amber",
  PONTO_EXCLUIDO: "amber",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  if (usuario.papel !== "ADMIN" && usuario.papel !== "SUPORTE") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta área é exclusiva de administradores e suporte.
        </p>
      </div>
    );
  }

  const { tipo } = await searchParams;

  const logs = await prisma.logEvento.findMany({
    where: tipo ? { tipo } : {},
    orderBy: { criadoEm: "desc" },
    take: 150,
    include: { usuario: { select: { nomeCompleto: true, username: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Logs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Login, erros de API/banco e principais eventos do sistema.
          </p>
        </div>
        <FiltroTipoLog valorAtual={tipo ?? ""} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Detalhe</th>
              <th className="px-4 py-3 font-medium">Quando</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                <td className="px-4 py-3">
                  <Badge tone={TOM_POR_TIPO[log.tipo] ?? "slate"}>{log.tipo}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {log.usuario?.nomeCompleto ?? "—"}
                </td>
                <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {log.detalhe ? JSON.stringify(log.detalhe) : "—"}
                </td>
                <td className="tabular px-4 py-3 text-slate-500 dark:text-slate-400">
                  {formatarDataHora(log.criadoEm)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum evento registrado para este filtro.
          </p>
        )}
      </Card>
    </div>
  );
}
