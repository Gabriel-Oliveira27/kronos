"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROTULOS_PAPEL } from "@/lib/utils";
import type { Papel } from "@prisma/client";

export function UserMenu({ nomeCompleto, papel }: { nomeCompleto: string; papel: Papel }) {
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  async function sair() {
    setSaindo(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const iniciais = nomeCompleto
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-xs font-semibold text-white">
          {iniciais}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
            {nomeCompleto}
          </span>
          <span className="block text-xs text-slate-400 dark:text-slate-500">{ROTULOS_PAPEL[papel]}</span>
        </span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={sair}
            disabled={saindo}
            className="block w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {saindo ? "Saindo…" : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
