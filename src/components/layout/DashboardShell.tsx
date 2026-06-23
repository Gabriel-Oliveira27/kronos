"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PerfilDropdown } from "@/components/layout/PerfilDropdown";
import { NavLoadingOverlay } from "@/components/layout/NavLoadingOverlay";
import type { Papel } from "@prisma/client";

interface TemaConfig { textColor?: string; borderColor?: string; activeColor?: string; secondaryColor?: string }

export function DashboardShell({
  papel, nomeCompleto, fotoUrl, temaBase, temaConfig, children,
}: {
  papel: Papel;
  nomeCompleto: string;
  fotoUrl?: string | null;
  temaBase?: string | null;
  temaConfig?: TemaConfig | null;
  children: ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

  // No App Router o layout persiste entre navegações, então o drawer mobile
  // continuaria aberto ao trocar de página. Fecha sempre que a rota muda.
  useEffect(() => { setMenuAberto(false); }, [pathname]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--tema-bg-page)" }}>
      <NavLoadingOverlay />
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r lg:block" style={{ borderColor: "var(--tema-border)", backgroundColor: "var(--tema-bg-surface)" }}>
        <Sidebar papel={papel} className="sticky top-0 h-screen overflow-y-auto" />
      </aside>

      {/* Sidebar mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuAberto(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl" style={{ backgroundColor: "var(--tema-bg-surface)" }}>
            <Sidebar papel={papel} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6"
          style={{ borderColor: "var(--tema-border)", backgroundColor: "var(--tema-bg-surface)" }}>
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <PerfilDropdown
              nomeCompleto={nomeCompleto}
              papel={papel}
              fotoUrl={fotoUrl ?? null}
              temaBase={temaBase}
              temaConfig={temaConfig}
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
