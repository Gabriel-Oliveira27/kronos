import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { formatarData } from "@/lib/utils";

export default async function PontoPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  const registros = await prisma.registroPonto.findMany({
    where: { usuarioId: usuario.id, deletadoEm: null },
    orderBy: { data: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Meu ponto</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Histórico somente leitura — as batidas vêm da sincronização com o app.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        {registros.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma batida sincronizada ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Horário</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                  <td className="tabular px-4 py-3 text-slate-700 dark:text-slate-300">{formatarData(r.data)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.tipoEvento}</td>
                  <td className="tabular px-4 py-3 text-slate-700 dark:text-slate-300">
                    {r.horarioReal ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={r.confirmado ? "green" : "amber"}>
                      {r.confirmado ? "Confirmado" : "Pendente"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
