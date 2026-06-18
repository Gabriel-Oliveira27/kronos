"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "kronos_ps";

const ROTULOS_TIPO: Record<string, string> = {
  NORMAL: "Normal",
  PLANTAO: "Plantão",
  HOME_OFFICE: "HO",
  FOLGA: "Folga",
  SABADO_REDUZIDO: "Sáb+",
};

const CORES_TIPO: Record<string, string> = {
  NORMAL: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  PLANTAO: "bg-brand-blue text-white",
  HOME_OFFICE: "bg-brand-green text-white",
  FOLGA: "bg-amber-400 text-amber-950",
  SABADO_REDUZIDO: "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
};

interface EscalaItem {
  id: string;
  usuarioId: string;
  data: string;
  tipo: string;
  observacao: string | null;
  usuario: { id: string; nomeCompleto: string; setor: string };
}

interface Usuario {
  id: string;
  nomeCompleto: string;
  setor: string;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function diasDoMes(mes: string): string[] {
  const [ano, m] = mes.split("-").map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  return Array.from({ length: ultimo }, (_, i) => {
    const d = i + 1;
    return `${mes}-${String(d).padStart(2, "0")}`;
  });
}

function moverMes(mes: string, delta: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeDoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function EscalaPublicaPage() {
  const [ps, setPs] = useState("");
  const [psInput, setPsInput] = useState("");
  const [mes, setMes] = useState(mesAtual);
  const [dados, setDados] = useState<{ escalas: EscalaItem[]; usuarios: Usuario[] } | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Recupera palavra secreta da sessão ao montar
  useEffect(() => {
    const salva = sessionStorage.getItem(STORAGE_KEY) ?? "";
    if (salva) setPs(salva);
  }, []);

  const buscar = useCallback(
    async (palavraSecreta: string, mesBuscar: string) => {
      setCarregando(true);
      setErro(null);
      try {
        const res = await fetch(
          `/api/v1/escala-publica?ps=${encodeURIComponent(palavraSecreta)}&mes=${mesBuscar}`
        );
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            setErro("Palavra secreta incorreta. Tente novamente.");
            setPs("");
            sessionStorage.removeItem(STORAGE_KEY);
          } else {
            setErro(data?.error ?? "Não foi possível carregar a escala.");
          }
          setDados(null);
          return;
        }
        setDados(data);
      } catch {
        setErro("Não foi possível conectar ao servidor.");
        setDados(null);
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  // Quando temos palavra e muda o mês, recarrega automaticamente
  useEffect(() => {
    if (ps) buscar(ps, mes);
  }, [ps, mes, buscar]);

  function autenticar() {
    if (!psInput.trim()) return;
    sessionStorage.setItem(STORAGE_KEY, psInput.trim());
    setPs(psInput.trim());
  }

  function navegarMes(delta: number) {
    setMes((m) => moverMes(m, delta));
  }

  // ---- Tela de entrada da palavra secreta ----
  if (!ps) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1220] px-6 py-12">
        <Link href="/" className="mb-10">
          <Logo />
        </Link>
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="font-display text-xl font-semibold text-white">
            Escala do plantão
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Digite a palavra secreta para visualizar a escala da equipe sem precisar fazer login.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            <Input
              label="Palavra secreta"
              type="password"
              placeholder="••••••••"
              value={psInput}
              onChange={(e) => setPsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && autenticar()}
              autoFocus
              error={erro ?? undefined}
            />
            <Button onClick={autenticar} disabled={!psInput.trim()}>
              Ver escala
            </Button>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-600">
          Colaborador?{" "}
          <Link href="/login" className="text-brand-blue hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    );
  }

  // ---- Tela da escala ----
  const dias = diasDoMes(mes);
  const escalasMap = new Map<string, EscalaItem>();
  dados?.escalas.forEach((e) => {
    const chave = `${e.usuarioId}_${e.data.slice(0, 10)}`;
    escalasMap.set(chave, e);
  });
  const usuarios = dados?.usuarios ?? [];

  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Header */}
      <header className="border-b border-slate-800/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Visualização pública</span>
            <button
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                setPs("");
                setPsInput("");
                setDados(null);
              }}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Sair
            </button>
            <Link href="/login">
              <Button size="sm" variant="outline">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Navegação de mês */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold capitalize text-white">
              {nomeDoMes(mes)}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">Escala da equipe — somente leitura</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navegarMes(-1)}>
              ← Mês anterior
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMes(mesAtual())}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => navegarMes(1)}>
              Próximo mês →
            </Button>
          </div>
        </div>

        {erro && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {erro}
          </div>
        )}

        {carregando && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        )}

        {!carregando && dados && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="sticky left-0 z-10 bg-slate-900/95 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Colaborador
                  </th>
                  {dias.map((dia) => {
                    const d = new Date(dia + "T12:00:00");
                    const diaSem = d.getDay();
                    const num = Number(dia.slice(8));
                    const ehHoje = dia === new Date().toISOString().slice(0, 10);
                    return (
                      <th
                        key={dia}
                        className={cn(
                          "min-w-[48px] px-1 py-3 text-center text-[11px]",
                          diaSem === 0 || diaSem === 6
                            ? "text-slate-600"
                            : "text-slate-400",
                          ehHoje && "bg-brand-blue/10"
                        )}
                      >
                        <div className={cn("font-normal", ehHoje && "font-semibold text-brand-blue")}>
                          {DIAS_SEMANA[diaSem]}
                        </div>
                        <div
                          className={cn(
                            "mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                            ehHoje
                              ? "bg-brand-blue font-semibold text-white"
                              : "font-medium"
                          )}
                        >
                          {num}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/30"
                  >
                    <td className="sticky left-0 z-10 bg-[#0B1220] px-4 py-2.5 hover:bg-slate-900/30">
                      <p className="font-medium text-slate-200">{u.nomeCompleto}</p>
                      <p className="text-xs text-slate-500">{u.setor}</p>
                    </td>
                    {dias.map((dia) => {
                      const e = escalasMap.get(`${u.id}_${dia}`);
                      const ehHoje = dia === new Date().toISOString().slice(0, 10);
                      return (
                        <td
                          key={dia}
                          className={cn(
                            "px-1 py-2 text-center",
                            ehHoje && "bg-brand-blue/5"
                          )}
                        >
                          {e ? (
                            <span
                              title={e.observacao ?? ROTULOS_TIPO[e.tipo]}
                              className={cn(
                                "inline-flex h-7 w-10 items-center justify-center rounded-lg text-[10px] font-semibold",
                                CORES_TIPO[e.tipo] ?? "bg-slate-700 text-white"
                              )}
                            >
                              {ROTULOS_TIPO[e.tipo] ?? e.tipo}
                            </span>
                          ) : (
                            <span className="text-slate-800">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-500">
                Nenhum colaborador cadastrado ainda.
              </p>
            )}
          </div>
        )}

        {/* Legenda */}
        {dados && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(ROTULOS_TIPO).map(([tipo, rotulo]) => (
              <span key={tipo} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className={cn(
                    "inline-block h-4 w-7 rounded",
                    CORES_TIPO[tipo]
                  )}
                />
                {rotulo === "HO" ? "Home office" : rotulo}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
