"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import type { Papel } from "@prisma/client";

export function DashboardShell({
  papel,
  nomeCompleto,
  children,
}: {
  papel: Papel;
  nomeCompleto: string;
  children: ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-light dark:bg-bg-dark">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 lg:block">
        <Sidebar papel={papel} className="sticky top-0" />
      </aside>

      {menuAberto && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuAberto(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-bg-light shadow-xl dark:bg-bg-dark">
            <Sidebar papel={papel} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800 sm:px-6">
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu nomeCompleto={nomeCompleto} papel={papel} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
