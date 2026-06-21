"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [escuro, setEscuro] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  // Detecta preferência do sistema na montagem — roda só no cliente, sem warning
  // do React 19. Usuários com tema explícito (data-tema-explicito="1") já têm
  // a classe correta vinda do servidor, então esse efeito é no-op para eles.
  useEffect(() => {
    if (document.documentElement.dataset.temaExplicito === "0") {
      const prefereDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefereDark);
      setEscuro(prefereDark);
    }
  }, []);

  async function alternar() {
    const novoEscuro = !escuro;
    setEscuro(novoEscuro);
    document.documentElement.classList.toggle("dark", novoEscuro);
    document.documentElement.dataset.temaExplicito = "1";

    try {
      await fetch("/api/v1/usuarios/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temaBase: novoEscuro ? "dark" : "light" }),
      });
    } catch {
      // Preferência de tema não persistir não é crítico — a troca visual já aconteceu.
    }
  }

  return (
    <button
      onClick={alternar}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {escuro ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.41-1.41M6.05 6.05 4.64 4.64m13.72 0-1.41 1.41M6.05 17.95l-1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M21 12.6A9 9 0 1 1 11.4 3a7 7 0 0 0 9.6 9.6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
