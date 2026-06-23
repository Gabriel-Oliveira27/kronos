import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { ModelosHorarioBoard } from "@/components/dashboard/ModelosHorarioBoard";

export default async function ModelosHorarioPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;
  if (usuario.papel !== "CONFIGURADOR_ESCALA" && usuario.papel !== "ADMIN") {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500">Esta área é exclusiva do configurador de escala e administradores.</p>
    </div>;
  }
  const modelos = await prisma.modeloHorario.findMany({
    orderBy: { criadoEm: "desc" },
    include: { _count: { select: { usuarios: true } } },
  });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Modelos de horário</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jornadas reutilizáveis para associar a colaboradores.</p>
      </div>
      <ModelosHorarioBoard modelosIniciais={JSON.parse(JSON.stringify(modelos))} />
    </div>
  );
}
