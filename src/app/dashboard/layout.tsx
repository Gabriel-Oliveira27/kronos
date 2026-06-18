import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/session";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // O proxy.ts já bloqueia quem não tem cookie de sessão válido. Este check
  // aqui é a segunda camada: cobre o caso (raro, mas possível) de um token
  // ainda válido cujo usuário foi removido do banco nesse meio tempo.
  const usuario = await usuarioAtual();
  if (!usuario) {
    redirect("/login");
  }

  return (
    <DashboardShell papel={usuario.papel} nomeCompleto={usuario.nomeCompleto}>
      {children}
    </DashboardShell>
  );
}
