import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { SetoresBoard } from "@/components/dashboard/SetoresBoard";

export default async function SetoresPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;
  if (usuario.papel !== "ADMIN") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Esta área é exclusiva de administradores.</p>
      </div>
    );
  }

  const setores = await prisma.setor.findMany({ orderBy: { nome: "asc" } });
  return (
    <SetoresBoard
      setoresIniciais={setores.map((s) => ({ id: s.id, nome: s.nome, temPalavra: !!s.palavraSecretaHash }))}
    />
  );
}
