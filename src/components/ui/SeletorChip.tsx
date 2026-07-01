"use client";

import { useMemo, useRef, useState, useId, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface OpcaoChip {
  value: string;
  label: string;
}

interface BaseProps {
  label?: string;
  opcoes: OpcaoChip[];
  placeholder?: string;
  /** Permite adicionar um valor livre que não está na lista (ex.: setor novo). */
  permitirCriar?: boolean;
  disabled?: boolean;
  hint?: string;
  /** Classe do chip (cor). Padrão: azul da marca. */
  chipClassName?: string;
}

interface PropsUnico extends BaseProps {
  multiple?: false;
  /** Valor selecionado ("" quando vazio). */
  value: string;
  onChange: (value: string) => void;
}

interface PropsMultiplo extends BaseProps {
  multiple: true;
  /** Valores selecionados (em ordem; o 1º é o principal). */
  values: string[];
  onChangeValues: (values: string[]) => void;
}

type SeletorChipProps = PropsUnico | PropsMultiplo;

function Chip({
  rotulo,
  onRemover,
  onClick,
  disabled,
  chipClassName,
  titulo,
}: {
  rotulo: string;
  onRemover: () => void;
  onClick?: () => void;
  disabled?: boolean;
  chipClassName: string;
  titulo?: string;
}) {
  return (
    <span
      tabIndex={disabled ? -1 : 0}
      title={titulo}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Backspace" || e.key === "Delete")) {
          e.preventDefault();
          onRemover();
        }
        if (!disabled && (e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue/40",
        onClick && !disabled && "cursor-pointer",
        chipClassName
      )}
      onClick={disabled ? undefined : onClick}
    >
      <span className="truncate">{rotulo}</span>
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemover();
          }}
          aria-label={`Remover ${rotulo}`}
          className="grid h-4 w-4 shrink-0 place-items-center rounded-full opacity-70 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * Seletor no estilo "tag": um campo de digitação que filtra as opções; os
 * valores escolhidos viram chips de pontas arredondadas com "×". Backspace com
 * o campo vazio remove o último chip. No modo único, clicar no chip reabre a
 * busca para TROCAR o valor (sem precisar remover antes). No modo múltiplo o
 * campo continua visível para adicionar mais itens. Usado para Setor, Acesso e
 * Modelo de horário — mesma mecânica.
 */
export function SeletorChip(props: SeletorChipProps) {
  const {
    label, opcoes, placeholder = "Digite para buscar…", permitirCriar = false,
    disabled = false, hint,
    chipClassName = "bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/30",
  } = props;

  const selecionados = props.multiple ? props.values : props.value ? [props.value] : [];

  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  // Modo único com valor: o campo fica escondido até clicar no chip ("trocando").
  const [trocando, setTrocando] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fecharTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const rotuloDe = (v: string) => opcoes.find((o) => o.value === v)?.label ?? v;

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = opcoes.filter((o) => !selecionados.includes(o.value));
    if (!q) return base;
    return base.filter((o) => o.label.toLowerCase().includes(q));
  }, [busca, opcoes, selecionados]);

  const podeCriar =
    permitirCriar &&
    busca.trim().length > 0 &&
    !opcoes.some((o) => o.label.toLowerCase() === busca.trim().toLowerCase()) &&
    !selecionados.some((v) => v.toLowerCase() === busca.trim().toLowerCase());

  function selecionar(v: string) {
    if (props.multiple) {
      if (!props.values.includes(v)) props.onChangeValues([...props.values, v]);
      setBusca("");
      setDestaque(0);
      // mantém aberto para adicionar mais
      inputRef.current?.focus();
    } else {
      props.onChange(v);
      setBusca("");
      setAberto(false);
      setTrocando(false);
      setDestaque(0);
    }
  }

  function remover(v: string) {
    if (props.multiple) props.onChangeValues(props.values.filter((x) => x !== v));
    else props.onChange("");
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
      setTrocando(false);
    } else if (e.key === "Backspace" && busca === "" && selecionados.length > 0) {
      // Backspace com o campo vazio remove o último adicionado.
      remover(selecionados[selecionados.length - 1]);
    }
  }

  const mostraCampo = props.multiple || selecionados.length === 0 || trocando;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}

      <div className="relative">
        <div
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1 transition-colors",
            "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-brand-blue",
            "dark:border-slate-700 dark:bg-slate-900",
            disabled && "opacity-60"
          )}
          onClick={() => {
            if (disabled) return;
            if (mostraCampo) inputRef.current?.focus();
          }}
        >
          {selecionados.map((v, i) => (
            <Chip
              key={v}
              rotulo={rotuloDe(v)}
              titulo={
                props.multiple
                  ? i === 0 ? `${rotuloDe(v)} (principal)` : rotuloDe(v)
                  : "Clique para trocar"
              }
              disabled={disabled}
              chipClassName={cn(chipClassName, props.multiple && i === 0 && "font-semibold")}
              onRemover={() => remover(v)}
              onClick={
                props.multiple
                  ? undefined
                  : () => {
                      // Clique no chip (modo único) abre a busca para trocar.
                      setTrocando(true);
                      setAberto(true);
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }
              }
            />
          ))}

          {mostraCampo && (
            <input
              id={id}
              ref={inputRef}
              type="text"
              value={busca}
              disabled={disabled}
              placeholder={selecionados.length === 0 ? placeholder : props.multiple ? "Adicionar outro…" : "Trocar por…"}
              onChange={(e) => {
                setBusca(e.target.value);
                setAberto(true);
                setDestaque(0);
              }}
              onFocus={() => setAberto(true)}
              onBlur={() => {
                fecharTimer.current = setTimeout(() => {
                  setAberto(false);
                  setTrocando(false);
                  setBusca("");
                }, 120);
              }}
              onKeyDown={aoDigitar}
              className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          )}
        </div>

        {aberto && mostraCampo && (filtradas.length > 0 || podeCriar) && (
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

      {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </div>
  );
}
