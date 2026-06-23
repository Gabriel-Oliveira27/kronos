import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { ConhecimentoBoard } from "@/components/dashboard/ConhecimentoBoard";

export default async function ConhecimentoPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  const isAdmin = usuario.papel === "ADMIN" || usuario.papel === "SUPORTE";

  const itens = await prisma.conhecimentoItem.findMany({
    where: {
      deletadoEm: null,
      // Admin/Suporte veem tudo (inclusive privados de outros); demais só veem
      // os públicos e os próprios. Forma explícita — objeto vazio dentro de OR
      // não é confiável no Prisma para "ver tudo".
      ...(isAdmin ? {} : { OR: [{ visibilidade: "PUBLICO" }, { autorId: usuario.id }] }),
    },
    orderBy: { atualizadoEm: "desc" },
    include: { autor: { select: { id: true, nomeCompleto: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Base de conhecimento
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Consulte e contribua com procedimentos e informações da equipe.
        </p>
      </div>
      <ConhecimentoBoard
        itensIniciais={JSON.parse(JSON.stringify(itens))}
        usuarioId={usuario.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
