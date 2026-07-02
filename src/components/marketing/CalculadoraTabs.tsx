"use client";

import { useState } from "react";
import { ModoCalcular, ModoSimular, ModoDebito } from "@/components/marketing/CalculadoraModos";

const ABAS = [
  {
    id: "calcular" as const,
    titulo: "Horas do dia",
    descricao: "Some suas batidas e veja o total trabalhado.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "simular" as const,
    titulo: "Simular batidas",
    descricao: "Descubra quando sair para bater a meta.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "debito" as const,
    titulo: "Horas em débito",
    descricao: "Monte um plano para quitar as horas devidas.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function CalculadoraTabs() {
  const [aba, setAba] = useState<(typeof ABAS)[number]["id"]>("calcular");

  return (
    <div className="flex flex-col gap-6">
      {/* Seleção de modo em cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              aba === a.id
                ? "border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
            }`}
          >
            <span className={aba === a.id ? "text-brand-blue" : "text-slate-400 dark:text-slate-500"}>{a.icone}</span>
            <p className={`mt-2 font-display text-sm font-semibold ${aba === a.id ? "text-brand-blue" : "text-slate-800 dark:text-slate-100"}`}>
              {a.titulo}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{a.descricao}</p>
          </button>
        ))}
      </div>

      {/* Conteúdo do modo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        {aba === "calcular" && <ModoCalcular />}
        {aba === "simular" && <ModoSimular />}
        {aba === "debito" && <ModoDebito />}
      </div>
    </div>
  );
}
