"use client";

import { useState, useEffect } from "react";

type Tema = "claro" | "escuro" | "noturno";

const TEMAS: { valor: Tema; label: string; icone: React.ReactNode }[] = [
  {
    valor: "claro",
    label: "Claro",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.41-1.41M6.05 6.05 4.64 4.64m13.72 0-1.41 1.41M6.05 17.95l-1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    valor: "escuro",
    label: "Escuro",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d="M21 12.6A9 9 0 1 1 11.4 3a7 7 0 0 0 9.6 9.6Z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    valor: "noturno",
    label: "Noturno",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Z"
          stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 2v20M2 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function aplicarTema(tema: Tema) {
  const html = document.documentElement;
  html.dataset.tema = tema;
  html.dataset.temaExplicito = "1";
  html.classList.remove("dark", "night");
  if (tema === "escuro" || tema === "noturno") html.classList.add("dark");
  if (tema === "noturno") html.classList.add("night");
  // Persiste para manter o tema consistente em todas as telas (inclusive
  // públicas, sem login) — lido pelo script de inicialização no layout raiz.
  try { localStorage.setItem("kronos-tema", tema); } catch { /* ignore */ }
}

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("claro");
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    // O tema já foi resolvido pelo script de inicialização (layout raiz) ou
    // pelo servidor. Aqui só sincronizamos o estado visual do botão.
    const atual = document.documentElement.dataset.tema as Tema | undefined;
    if (atual && ["claro", "escuro", "noturno"].includes(atual)) setTema(atual);
  }, []);

  async function alternar(novoTema: Tema) {
    setTema(novoTema);
    setAberto(false);
    aplicarTema(novoTema);
    try {
      await fetch("/api/v1/usuarios/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temaBase: novoTema }),
      });
    } catch {
      // Falha silenciosa — a troca visual já aconteceu
    }
  }

  const atual = TEMAS.find((t) => t.valor === tema) ?? TEMAS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        title={`Tema: ${atual.label}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        {atual.icone}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            {TEMAS.map((t) => (
              <button
                key={t.valor}
                onClick={() => alternar(t.valor)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  tema === t.valor
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {t.icone}
                {t.label}
                {tema === t.valor && (
                  <svg className="ml-auto h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
