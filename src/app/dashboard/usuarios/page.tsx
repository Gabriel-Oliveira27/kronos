import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { UsuariosBoard } from "@/components/dashboard/UsuariosBoard";

export default async function UsuariosPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;
  if (usuario.papel !== "ADMIN" && usuario.papel !== "SUPORTE") {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500">Esta área é exclusiva de administradores e suporte.</p>
    </div>;
  }
  const usuarios = await prisma.usuario.findMany({
    orderBy: { criadoEm: "desc" },
    select: { id:true,nomeCompleto:true,setor:true,setores:true,email:true,username:true,papel:true,temApp:true,ativo:true,ehGhost:true,fotoUrl:true,modeloHorarioId:true,criadoEm:true },
  });
  return (
    <UsuariosBoard
      usuariosIniciais={JSON.parse(JSON.stringify(usuarios))}
      podeEditar={usuario.papel === "ADMIN"}
      descricao={usuario.papel === "ADMIN" ? "Gerencie acessos, setores e status dos colaboradores." : "Visão geral dos usuários — edição restrita a administradores."}
    />
  );
}
