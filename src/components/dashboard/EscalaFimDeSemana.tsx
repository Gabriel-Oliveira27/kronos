"use client";

import { forwardRef } from "react";
import type { UsuarioResumo, EscalaView } from "./EscalasBoard";

function primeiroNome(nome: string): string {
  return nome.split(" ")[0];
}

function fmtData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

function maisUmDia(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function nomeMes(mesAtivo?: string): string {
  if (!mesAtivo) return "";
  const [ano, mes] = mesAtivo.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export interface LinhaFds {
  sab: string;
  dom: string;
  plantao: string[];
  expediente: string[];
  folga: string[];
  homeOffice: string[];
}

/** Monta as linhas de fim de semana (uma por sábado do mês) a partir das escalas. */
export function montarLinhasFds(
  usuarios: UsuarioResumo[],
  escalas: EscalaView[],
  diasDoMes: string[]
): LinhaFds[] {
  const mapa = new Map<string, string>();
  for (const e of escalas) mapa.set(`${e.usuarioId}_${e.data.slice(0, 10)}`, e.tipo);

  const porTipo = (data: string, tipo: string) =>
    usuarios.filter((u) => mapa.get(`${u.id}_${data}`) === tipo).map((u) => primeiroNome(u.nomeCompleto));

  const sabados = diasDoMes.filter((d) => new Date(d + "T12:00:00Z").getUTCDay() === 6);

  return sabados.map((sab) => {
    const dom = maisUmDia(sab);
    // Plantão FDS = plantão no sábado e/ou no domingo
    const plantao = usuarios
      .filter((u) => mapa.get(`${u.id}_${sab}`) === "PLANTAO" || mapa.get(`${u.id}_${dom}`) === "PLANTAO")
      .map((u) => primeiroNome(u.nomeCompleto));
    return {
      sab,
      dom,
      plantao,
      expediente: porTipo(sab, "NORMAL"),
      folga: porTipo(sab, "FOLGA"),
      homeOffice: porTipo(sab, "HOME_OFFICE"),
    };
  });
}

export const EscalaFimDeSemana = forwardRef<
  HTMLDivElement,
  {
    usuarios: UsuarioResumo[];
    escalas: EscalaView[];
    diasDoMes: string[];
    mesAtivo?: string;
  }
>(function EscalaFimDeSemana({ usuarios, escalas, diasDoMes, mesAtivo }, ref) {
  const linhas = montarLinhasFds(usuarios, escalas, diasDoMes);
  const comHomeOffice = linhas.filter((l) => l.homeOffice.length > 0);

  const COL = "px-4 py-3 text-left align-top";

  return (
    <div
      ref={ref}
      className="flex flex-col gap-4 rounded-xl p-4"
      style={{ backgroundColor: "var(--tema-bg-page)" }}
    >
      <div>
        <p className="font-display text-lg font-semibold capitalize text-slate-900 dark:text-white">
          Escala de fim de semana — {nomeMes(mesAtivo)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Plantão de fim de semana, expediente e folga de sábado.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
            <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className={COL}>Data</th>
              <th className={COL}>Plantão FDS</th>
              <th className={COL}>Sábado Expediente</th>
              <th className={COL}>Sábado de Folga</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.sab} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                <td className={`${COL} whitespace-nowrap font-medium text-slate-700 dark:text-slate-200`}>
                  {fmtData(l.sab)} e {fmtData(l.dom)}
                </td>
                <td className={`${COL} text-brand-blue`}>{l.plantao.join(" / ") || "—"}</td>
                <td className={`${COL} text-slate-700 dark:text-slate-300`}>{l.expediente.join(" / ") || "—"}</td>
                <td className={`${COL} text-amber-700 dark:text-amber-400`}>{l.folga.join(" / ") || "—"}</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum sábado neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {comHomeOffice.length > 0 && (
        <div className="rounded-xl border border-brand-green/30 bg-brand-green/5 p-4 dark:bg-brand-green/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-green-dark dark:text-brand-green">
            Home office no sábado (14h - 22h)
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {comHomeOffice.map((l) => (
              <p key={l.sab} className="text-sm text-slate-600 dark:text-slate-300">
                {fmtData(l.sab)} — {l.homeOffice.join(", ")}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
