"use client";

import { useMemo, useRef, useState, useId, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface OpcaoChip {
  value: string;
  label: string;
}

interface SeletorChipProps {
  label?: string;
  /** Valor selecionado ("" quando vazio). */
  value: string;
  onChange: (value: string) => void;
  opcoes: OpcaoChip[];
  placeholder?: string;
  /** Permite adicionar um valor livre que não está na lista (ex.: setor novo). */
  permitirCriar?: boolean;
  disabled?: boolean;
  hint?: string;
  /** Classe do chip (cor). Padrão: azul da marca. */
  chipClassName?: string;
}

/**
 * Seletor no estilo "tag": quando vazio, é um campo de digitação que filtra as
 * opções (bom quando há muitas); quando preenchido, mostra o valor como um chip
 * de pontas arredondadas com um "×". Backspace/Delete com o chip focado remove
 * rapidamente. Usado para Setor, Acesso e Modelo de horário — mesma mecânica.
 */
export function SeletorChip({
  label,
  value,
  onChange,
  opcoes,
  placeholder = "Digite para buscar…",
  permitirCriar = false,
  disabled = false,
  hint,
  chipClassName = "bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/30",
}: SeletorChipProps) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fecharTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const rotuloSelecionado = useMemo(() => {
    if (!value) return "";
    return opcoes.find((o) => o.value === value)?.label ?? value;
  }, [value, opcoes]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = opcoes.filter((o) => o.value !== value);
    if (!q) return base;
    return base.filter((o) => o.label.toLowerCase().includes(q));
  }, [busca, opcoes, value]);

  const podeCriar =
    permitirCriar &&
    busca.trim().length > 0 &&
    !opcoes.some((o) => o.label.toLowerCase() === busca.trim().toLowerCase());

  function selecionar(v: string) {
    onChange(v);
    setBusca("");
    setAberto(false);
    setDestaque(0);
  }

  function limpar() {
    onChange("");
    setBusca("");
    // devolve o foco para o campo de digitação
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function aoDigitar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtradas[destaque]) selecionar(filtradas[destaque].value);
      else if (podeCriar) selecionar(busca.trim());
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setDestaque((d) => Math.min(d + 1, Math.max(filtradas.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === "Escape") {
      setAberto(false);
    } else if (e.key === "Backspace" && busca === "" && value) {
      // Backspace com o campo vazio remove o que já está adicionado.
      limpar();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}

      {value ? (
        // ── Estado preenchido: chip com × ──
        <div
          className={cn(
            "flex h-10 items-center rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900",
            disabled && "opacity-60"
          )}
        >
          <span
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === "Backspace" || e.key === "Delete")) {
                e.preventDefault();
                limpar();
              }
            }}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue/40",
              chipClassName
            )}
          >
            <span className="truncate">{rotuloSelecionado}</span>
            {!disabled && (
              <button
                type="button"
                onClick={limpar}
                aria-label="Remover"
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full opacity-70 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </span>
        </div>
      ) : (
        // ── Estado vazio: campo de busca + dropdown ──
        <div className="relative">
          <input
            id={id}
            ref={inputRef}
            type="text"
            value={busca}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => {
              setBusca(e.target.value);
              setAberto(true);
              setDestaque(0);
            }}
            onFocus={() => setAberto(true)}
            onBlur={() => {
              // atraso para permitir o clique numa opção antes de fechar
              fecharTimer.current = setTimeout(() => setAberto(false), 120);
            }}
            onKeyDown={aoDigitar}
            className={cn(
              "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors",
              "focus:outline-2 focus:outline-offset-1 focus:outline-brand-blue",
              "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
              disabled && "opacity-60"
            )}
          />

          {aberto && (filtradas.length > 0 || podeCriar) && (
            <ul
              className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              onMouseDown={(e) => {
                // evita o blur do input fechar antes do clique registrar
                e.preventDefault();
                if (fecharTimer.current) clearTimeout(fecharTimer.current);
              }}
            >
              {filtradas.map((o, i) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => selecionar(o.value)}
                    onMouseEnter={() => setDestaque(i)}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200",
                      i === destaque ? "bg-brand-blue/10 text-brand-blue" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
              {podeCriar && (
                <li>
                  <button
                    type="button"
                    onClick={() => selecionar(busca.trim())}
                    className="block w-full px-3 py-1.5 text-left text-sm text-brand-blue hover:bg-brand-blue/10"
                  >
                    Adicionar “{busca.trim()}”
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </div>
  );
}
