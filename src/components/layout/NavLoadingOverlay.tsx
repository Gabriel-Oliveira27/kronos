"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Overlay de carregamento entre telas. Como o App Router não expõe eventos de
 * navegação, detectamos o início interceptando cliques em links internos e o
 * fim observando a mudança de pathname (a rota só "commita" quando o conteúdo
 * está pronto). Um atraso curto evita piscar em navegações instantâneas.
 */
export function NavLoadingOverlay() {
  const pathname = usePathname();
  const [carregando, setCarregando] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function limparTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // Fim da navegação: a rota mudou → conteúdo pronto.
  useEffect(() => {
    limparTimer();
    setCarregando(false);
  }, [pathname]);

  // Início da navegação: clique num link interno para outra rota.
  useEffect(() => {
    function aoClicar(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const alvo = (e.target as HTMLElement | null)?.closest("a");
      if (!alvo) return;
      const href = alvo.getAttribute("href");
      const target = alvo.getAttribute("target");
      if (!href || !href.startsWith("/") || target === "_blank") return;
      // Downloads e endpoints de API não são navegação de página — não mostram
      // o overlay (senão ele fica infinito, pois o pathname não muda).
      if (alvo.hasAttribute("download") || href.startsWith("/api/")) return;

      const url = new URL(href, window.location.origin);
      // Mesma rota → não há navegação.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      limparTimer();
      timerRef.current = setTimeout(() => setCarregando(true), 150);
    }
    document.addEventListener("click", aoClicar);
    return () => {
      document.removeEventListener("click", aoClicar);
      limparTimer();
    };
  }, []);

  // Trava o scroll enquanto o overlay está visível.
  useEffect(() => {
    if (!carregando) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, [carregando]);

  if (!carregando) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-[1px]"
      style={{ backgroundColor: "color-mix(in srgb, var(--tema-bg-page) 55%, transparent)" }}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Carregando…</p>
      </div>
    </div>
  );
}
