import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessao = await usuarioAtual();
  if (!sessao) redirect("/login");

  // Busca campos adicionais que o DashboardShell precisa (fotoUrl, temaConfig)
  // mas que a sessão JWT não carrega para manter o token pequeno.
  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.id },
    select: { id: true, nomeCompleto: true, papel: true, fotoUrl: true, temaBase: true, corDestaque: true, temaConfig: true, ativo: true },
  });

  if (!usuario || !usuario.ativo) redirect("/login");

  return (
    <DashboardShell
      papel={usuario.papel}
      nomeCompleto={usuario.nomeCompleto}
      fotoUrl={usuario.fotoUrl}
      temaBase={usuario.temaBase}
      corDestaque={usuario.corDestaque}
      temaConfig={usuario.temaConfig as Record<string, string> | null}
    >
      {children}
    </DashboardShell>
  );
}
