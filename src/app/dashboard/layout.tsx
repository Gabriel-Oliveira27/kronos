import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

// PWA: o manifest e as meta tags da Apple ficam SÓ no dashboard, então a opção
// "Instalar" aparece apenas aqui (não na landing/login).
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kronos", statusBarStyle: "default" },
  icons: { apple: "/logo-192.png" },
};

export const viewport: Viewport = { themeColor: "#2563EB" };

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
    <>
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
      <InstallPrompt />
    </>
  );
}
