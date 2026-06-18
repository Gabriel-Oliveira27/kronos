import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { formatarDataHora } from "@/lib/utils";

export default async function RegistrosExcluidosPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  if (usuario.papel !== "ADMIN") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Esta área é exclusiva de administradores.</p>
      </div>
    );
  }

  const registros = await prisma.registroExcluido.findMany({
    orderBy: { excluidoEm: "desc" },
    take: 150,
  });

  const idsUsuarios = Array.from(new Set(registros.map((r) => r.excluidoPorId)));
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: idsUsuarios } },
    select: { id: true, nomeCompleto: true },
  });
  const nomePor: Record<string, string> = {};
  usuarios.forEach((u) => (nomePor[u.id] = u.nomeCompleto));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Registros excluídos
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Auditoria de exclusões (soft delete) de pontos e itens de conhecimento.
        </p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Tabela</th>
              <th className="px-4 py-3 font-medium">Registro</th>
              <th className="px-4 py-3 font-medium">Excluído por</th>
              <th className="px-4 py-3 font-medium">Quando</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                <td className="px-4 py-3">
                  <Badge tone="slate">{r.tabelaOrigem}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {r.registroId}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {nomePor[r.excluidoPorId] ?? r.excluidoPorId}
                </td>
                <td className="tabular px-4 py-3 text-slate-500 dark:text-slate-400">
                  {formatarDataHora(r.excluidoEm)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registros.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma exclusão registrada ainda.
          </p>
        )}
      </Card>
    </div>
  );
}
