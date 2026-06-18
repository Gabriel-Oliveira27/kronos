import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { UsuariosBoard } from "@/components/dashboard/UsuariosBoard";

export default async function UsuariosPage() {
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

  const usuarios = await prisma.usuario.findMany({
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nomeCompleto: true,
      setor: true,
      email: true,
      username: true,
      papel: true,
      temApp: true,
      criadoEm: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Usuários</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {usuario.papel === "ADMIN"
            ? "Gerencie quem tem acesso ao Kronos, papéis e uso do app."
            : "Visão de todos os usuários — edição é restrita a administradores."}
        </p>
      </div>
      <UsuariosBoard usuariosIniciais={JSON.parse(JSON.stringify(usuarios))} podeEditar={usuario.papel === "ADMIN"} />
    </div>
  );
}
