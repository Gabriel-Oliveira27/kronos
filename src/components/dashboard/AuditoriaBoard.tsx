"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { formatarDataHora, cn, ROTULOS_TIPO_DIA, ROTULOS_ACESSO } from "@/lib/utils";

export interface ItemLog {
  id: string;
  tipo: string;
  rotulo: string;
  tom: "blue" | "green" | "amber" | "red" | "slate";
  descricao: string;
  ator: string;
  quando: string; // ISO
  detalhe?: unknown;
}

function obj(d: unknown): Record<string, unknown> {
  return d && typeof d === "object" ? (d as Record<string, unknown>) : {};
}

function fmtDataBr(iso: unknown): string {
  const s = String(iso ?? "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  const [a, m, d] = s.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

function rotuloTipoDia(tipo: unknown): string {
  if (tipo === null || tipo === undefined) return "—";
  return ROTULOS_TIPO_DIA[String(tipo)] ?? String(tipo);
}

const ROTULOS_CAMPO: Record<string, string> = {
  nomeCompleto: "Nome", setores: "Setores", email: "E-mail", papel: "Acesso",
  temApp: "Usa app", ativo: "Ativo", modeloHorarioId: "Modelo de horário",
  senha: "Senha", foto: "Foto", nome: "Nome",
  horasSemanais: "Horas semanais", jornadaDiaria: "Jornada diária", jornadaPlantao: "Semana de plantão",
};

function fmtValor(campo: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (campo === "papel") return ROTULOS_ACESSO[String(v)] ?? String(v);
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x !== null ? (x as { nome?: string }).nome ?? JSON.stringify(x) : String(x))).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Tabela de diffs campo | antes | depois (usuários e modelos de horário). */
function TabelaDiffs({ diffs }: { diffs: { campo: string; antes: unknown; depois: unknown }[] }) {
  if (!diffs.length) return <p className="text-xs text-slate-400">Nenhuma mudança de valor registrada.</p>;
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <th className="py-1 pr-3 font-medium">Campo</th>
          <th className="py-1 pr-3 font-medium">Antes</th>
          <th className="py-1 font-medium">Depois</th>
        </tr>
      </thead>
      <tbody>
        {diffs.map((d, i) => (
          <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
            <td className="py-1.5 pr-3 font-medium text-slate-600 dark:text-slate-300">{ROTULOS_CAMPO[d.campo] ?? d.campo}</td>
            <td className="py-1.5 pr-3 text-slate-500 line-through decoration-slate-300 dark:text-slate-400">{fmtValor(d.campo, d.antes)}</td>
            <td className="py-1.5 font-semibold text-slate-800 dark:text-slate-100">{fmtValor(d.campo, d.depois)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Visão "do sistema" do que foi feito, por tipo de evento. */
function DetalheEvento({ tipo, detalhe }: { tipo: string; detalhe: unknown }) {
  const d = obj(detalhe);

  // Escala: lista de mudanças por pessoa/dia (antes → depois)
  if (tipo === "ESCALA_ALTERADA" && Array.isArray(d.mudancas) && d.mudancas.length > 0) {
    const mudancas = d.mudancas as { usuario: string; data: string; antes: string | null; depois: string | null }[];
    return (
      <ul className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
        {mudancas.map((m, i) => (
          <li key={i} className="flex flex-wrap items-center gap-1.5">
            <span className="tabular font-medium text-slate-500 dark:text-slate-400">{fmtDataBr(m.data)}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{m.usuario}</span>
            {m.depois === null ? (
              <span className="text-red-600 dark:text-red-400">removido da escala (era {rotuloTipoDia(m.antes)})</span>
            ) : m.antes === null ? (
              <span className="text-green-700 dark:text-green-400">adicionado como {rotuloTipoDia(m.depois)}</span>
            ) : (
              <span>{rotuloTipoDia(m.antes)} <span className="text-slate-400">→</span> <b>{rotuloTipoDia(m.depois)}</b></span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // Usuário editado / modelo editado: tabela de diffs
  if ((tipo === "ACESSO_EDITADO" || tipo === "MODELO_HORARIO_EDITADO") && Array.isArray(d.diffs)) {
    return <TabelaDiffs diffs={d.diffs as { campo: string; antes: unknown; depois: unknown }[]} />;
  }

  // Conhecimento excluído: snapshot do conteúdo que sumiu
  if (tipo === "CONHECIMENTO_EXCLUIDO" && d.titulo) {
    return (
      <div className="flex flex-col gap-2 text-xs">
        <p>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{String(d.titulo)}</span>
          {d.categoria ? <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">{String(d.categoria)}</span> : null}
          <span className="ml-2 text-slate-400">{d.visibilidade === "PUBLICO" ? "público" : "privado"}</span>
        </p>
        {d.conteudo ? (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {String(d.conteudo)}
          </pre>
        ) : null}
      </div>
    );
  }

  // Ponto excluído: o registro que foi removido
  if (tipo === "PONTO_EXCLUIDO" && d.data) {
    return (
      <p className="text-xs text-slate-600 dark:text-slate-300">
        Batida de <b>{fmtDataBr(d.data)}</b>
        {d.horarioReal ? <> às <b>{String(d.horarioReal)}</b></> : null}
        {d.tipoEvento ? <> · evento <b>{String(d.tipoEvento)}</b></> : null}
        {d.origem ? <> · origem {String(d.origem)}</> : null}
      </p>
    );
  }

  // Etiquetas do setor: antes → depois
  if (tipo === "SETOR_EDITADO" && d.acao === "etiquetas") {
    return (
      <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
        <p><span className="font-medium text-slate-400">Antes:</span> {fmtValor("etiquetas", d.antes)}</p>
        <p><span className="font-medium text-slate-400">Depois:</span> {fmtValor("etiquetas", d.depois)}</p>
      </div>
    );
  }

  // Fallback: pares chave → valor legíveis
  const entradas = Object.entries(d).filter(([, v]) => v !== undefined);
  if (entradas.length === 0) return <p className="text-xs text-slate-400">Sem detalhes adicionais.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {entradas.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-medium text-slate-400 dark:text-slate-500">{k}</dt>
          <dd className="break-all text-slate-600 dark:text-slate-300">{fmtValor(k, v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AuditoriaBoard({
  auditoria,
  sistema,
}: {
  auditoria: ItemLog[];
  sistema: ItemLog[];
}) {
  const [aba, setAba] = useState<"auditoria" | "sistema">("auditoria");
  const [abertoId, setAbertoId] = useState<string | null>(null);
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
            onClick={() => { setAba(id); setAbertoId(null); }}
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
          {itens.map((it) => {
            const aberto = abertoId === it.id;
            const expansivel = it.detalhe !== undefined && it.detalhe !== null;
            return (
              <li key={it.id}>
                <button
                  onClick={() => expansivel && setAbertoId(aberto ? null : it.id)}
                  className={cn(
                    "flex w-full flex-col gap-1.5 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3",
                    expansivel && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40",
                    aberto && "bg-slate-50 dark:bg-slate-800/40"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {expansivel ? (
                      <svg viewBox="0 0 24 24" fill="none"
                        className={cn("h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200", aberto && "rotate-90")}>
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <Badge tone={it.tom} className="shrink-0">{it.rotulo}</Badge>
                    <p className="min-w-0 truncate text-sm text-slate-700 dark:text-slate-200">
                      {it.descricao || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 pl-7 text-xs text-slate-400 dark:text-slate-500 sm:pl-0">
                    <span className="truncate">{it.ator}</span>
                    <span className="tabular whitespace-nowrap">{formatarDataHora(it.quando)}</span>
                  </div>
                </button>

                {/* Expansão: a visão do sistema antes/depois da alteração */}
                <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 pl-11 dark:border-slate-800/60 dark:bg-slate-800/20">
                      <DetalheEvento tipo={it.tipo} detalhe={it.detalhe} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
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
