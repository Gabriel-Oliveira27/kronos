"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TEMAS, aplicarTema, type Tema } from "@/components/layout/ThemeToggle";

/** Menu do header que expande ao passar o mouse (com atraso curto para não
 * fechar ao mover o cursor até o conteúdo). Também abre por clique/foco para
 * funcionar em touch e teclado. */
function MenuHover({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const fecharTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function abrir() {
    if (fecharTimer.current) clearTimeout(fecharTimer.current);
    setAberto(true);
  }
  function agendarFechar() {
    fecharTimer.current = setTimeout(() => setAberto(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={abrir} onMouseLeave={agendarFechar}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        {rotulo}
        <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-30 pt-2">
          <div className="w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

const ITEM_CLS =
  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

/** Menu "Serviços": calculadora de horas e download do app. */
export function MenuServicos() {
  return (
    <MenuHover rotulo="Serviços">
      <Link href="/calculadora" className={ITEM_CLS}>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-brand-blue">
          <path d="M9 7.5h6M9 12h6m-6 4.5h3M6.75 3h10.5A2.25 2.25 0 0 1 19.5 5.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25A2.25 2.25 0 0 1 6.75 3Z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          Calculadora de horas
          <span className="block text-[11px] text-slate-400 dark:text-slate-500">Horas do dia, simulação e débito</span>
        </span>
      </Link>
      <Link href="/baixar-app" className={ITEM_CLS}>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-brand-green">
          <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          Baixe o App
          <span className="block text-[11px] text-slate-400 dark:text-slate-500">Kronos para Android (APK)</span>
        </span>
      </Link>
    </MenuHover>
  );
}

/** Menu "Aparência": alternador simples de tema. */
export function MenuAparencia() {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    const atual = document.documentElement.dataset.tema as Tema | undefined;
    if (atual && ["claro", "escuro", "noturno"].includes(atual)) setTema(atual);
  }, []);

  function trocar(novo: Tema) {
    setTema(novo);
    aplicarTema(novo);
  }

  return (
    <MenuHover rotulo="Aparência">
      {TEMAS.map((t) => (
        <button key={t.valor} onClick={() => trocar(t.valor)}
          className={`${ITEM_CLS} ${tema === t.valor ? "text-brand-blue dark:text-brand-blue" : ""}`}>
          {t.icone}
          {t.label}
          {tema === t.valor && (
            <svg className="ml-auto h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      ))}
    </MenuHover>
  );
}
