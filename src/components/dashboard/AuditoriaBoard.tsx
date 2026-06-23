"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { formatarDataHora, cn } from "@/lib/utils";

export interface ItemLog {
  id: string;
  rotulo: string;
  tom: "blue" | "green" | "amber" | "red" | "slate";
  descricao: string;
  ator: string;
  quando: string; // ISO
}

export function AuditoriaBoard({
  auditoria,
  sistema,
}: {
  auditoria: ItemLog[];
  sistema: ItemLog[];
}) {
  const [aba, setAba] = useState<"auditoria" | "sistema">("auditoria");
  const itens = aba === "auditoria" ? auditoria : sistema;

  const abas = [
    { id: "auditoria" as const, label: "Auditoria", count: auditoria.length },
    { id: "sistema" as const, label: "Acessos & Erros", count: sistema.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {abas.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              aba === id
                ? "bg-brand-blue text-white"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] font-semibold",
                aba === id ? "bg-white/20" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      <Card className="animate-painel p-0">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {itens.map((it) => (
            <li
              key={it.id}
              className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Badge tone={it.tom} className="shrink-0">{it.rotulo}</Badge>
                <p className="min-w-0 truncate text-sm text-slate-700 dark:text-slate-200">
                  {it.descricao || "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span className="truncate">{it.ator}</span>
                <span className="tabular whitespace-nowrap">{formatarDataHora(it.quando)}</span>
              </div>
            </li>
          ))}
        </ul>
        {itens.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum evento nesta aba.
          </p>
        )}
      </Card>
    </div>
  );
}
