"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISPENSADO_KEY = "kronos-pwa-dispensado";

/**
 * Afixa a opção de "Instalar app" no dashboard (PWA). No Chrome/Android usa o
 * prompt nativo (`beforeinstallprompt`); no Safari/iOS (que não tem prompt)
 * mostra as instruções de "Adicionar à Tela de Início". Some quando o app já
 * está instalado (rodando em modo standalone) ou quando dispensado.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [oculto, setOculto] = useState(true);
  const [mostrarPassosIOS, setMostrarPassosIOS] = useState(false);

  useEffect(() => {
    // Registra o service worker (necessário para a instalação no Chrome).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const dispensado = sessionStorage.getItem(DISPENSADO_KEY) === "1";
    if (standalone || dispensado) return; // já instalado ou dispensado: não mostra

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !("MSStream" in window);
    setIsIOS(ios);
    if (ios) setOculto(false); // iOS não emite beforeinstallprompt → mostra direto

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOculto(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setOculto(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (oculto) return null;

  const dispensar = () => {
    sessionStorage.setItem(DISPENSADO_KEY, "1");
    setOculto(true);
    setMostrarPassosIOS(false);
  };

  const instalar = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setOculto(true);
    } else if (isIOS) {
      setMostrarPassosIOS(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <button
          onClick={instalar}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue/90"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Instalar app
        </button>
        <button
          onClick={dispensar}
          aria-label="Dispensar"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mostrarPassosIOS && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={dispensar}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-slate-900 dark:text-white">Instalar no iPhone/iPad</p>
            <ol className="mt-3 flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
              <li>1. Toque no botão <span className="font-medium">Compartilhar</span> (quadrado com seta) na barra do Safari.</li>
              <li>2. Escolha <span className="font-medium">Adicionar à Tela de Início</span>.</li>
              <li>3. Confirme em <span className="font-medium">Adicionar</span>.</li>
            </ol>
            <button
              onClick={dispensar}
              className="mt-4 w-full rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
