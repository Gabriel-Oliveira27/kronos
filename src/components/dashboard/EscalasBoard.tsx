"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Field";
import { BadgeTipoEscala } from "@/components/ui/Card";
import { ROTULOS_TIPO_DIA, cn } from "@/lib/utils";

export interface UsuarioResumo {
  id: string;
  nomeCompleto: string;
  setor: string;
  temApp: boolean;
}

export interface EscalaView {
  id: string;
  usuarioId: string;
  data: string;
  tipo: string;
  observacao: string | null;
}

const TIPOS = ["NORMAL", "PLANTAO", "HOME_OFFICE", "FOLGA", "SABADO_REDUZIDO"] as const;
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

const CORES_CELULA: Record<string, string> = {
  PLANTAO: "bg-brand-blue/20 text-brand-blue ring-1 ring-brand-blue/30",
  HOME_OFFICE: "bg-brand-green/20 text-brand-green ring-1 ring-brand-green/30",
  FOLGA: "bg-amber-400/20 text-amber-500 ring-1 ring-amber-400/30",
  NORMAL: "bg-slate-700/30 text-slate-400",
  SABADO_REDUZIDO: "bg-slate-600/30 text-slate-500",
};

export function EscalasBoard({
  usuarios: usuariosIniciais,
  escalasIniciais,
  diasDoMes,
}: {
  usuarios: UsuarioResumo[];
  escalasIniciais: EscalaView[];
  diasDoMes: string[]; // ISO yyyy-mm-dd, todos os dias do mês
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [escalas, setEscalas] = useState(escalasIniciais);
  const [selecao, setSelecao] = useState<{ usuarioId: string; data: string } | null>(null);
  const [tipo, setTipo] = useState<string>("NORMAL");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estado do formulário de membro avulso
  const [painel, setPainel] = useState<"escala" | "avulso">("escala");
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [setorAvulso, setSetorAvulso] = useState("Geral");
  const [adicionando, setAdicionando] = useState(false);
  const [erroAvulso, setErroAvulso] = useState<string | null>(null);

  function mapaEscalas() {
    const m = new Map<string, EscalaView>();
    for (const e of escalas) m.set(`${e.usuarioId}_${e.data.slice(0, 10)}`, e);
    return m;
  }
  const mapa = mapaEscalas();

  function selecionar(usuarioId: string, data: string) {
    const existente = mapa.get(`${usuarioId}_${data}`);
    setSelecao({ usuarioId, data });
    setTipo(existente?.tipo ?? "NORMAL");
    setObservacao(existente?.observacao ?? "");
    setErro(null);
    setPainel("escala");
  }

  async function salvar() {
    if (!selecao) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/v1/escalas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: selecao.usuarioId, data: selecao.data, tipo, observacao }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error ?? "Não foi possível salvar."); return; }
      setEscalas((prev) => [
        ...prev.filter(
          (e) => !(e.usuarioId === selecao.usuarioId && e.data.slice(0, 10) === selecao.data)
        ),
        data,
      ]);
      setSelecao(null);
    } catch { setErro("Não foi possível conectar ao servidor."); }
    finally { setSalvando(false); }
  }

  async function remover() {
    if (!selecao) return;
    const existente = mapa.get(`${selecao.usuarioId}_${selecao.data}`);
    if (!existente) { setSelecao(null); return; }
    setSalvando(true);
    try {
      const res = await fetch(`/api/v1/escalas/${existente.id}`, { method: "DELETE" });
      if (res.ok) {
        setEscalas((prev) => prev.filter((e) => e.id !== existente.id));
        setSelecao(null);
      }
    } finally { setSalvando(false); }
  }

  async function adicionarAvulso() {
    if (!nomeAvulso.trim()) return;
    setAdicionando(true);
    setErroAvulso(null);
    try {
      const res = await fetch("/api/v1/admin/usuarios/avulso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeAvulso.trim(), setor: setorAvulso.trim() || "Geral" }),
      });
      const data = await res.json();
      if (!res.ok) { setErroAvulso(data?.error ?? "Não foi possível adicionar."); return; }
      setUsuarios((prev) => [...prev, { id: data.id, nomeCompleto: data.nomeCompleto, setor: data.setor, temApp: false }]);
      setNomeAvulso("");
      setSetorAvulso("Geral");
      setPainel("escala");
    } catch { setErroAvulso("Não foi possível conectar ao servidor."); }
    finally { setAdicionando(false); }
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Tabela mensal */}
      <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="sticky left-0 z-10 min-w-[160px] bg-white px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                Colaborador
              </th>
              {diasDoMes.map((dia) => {
                const d = new Date(dia + "T12:00:00");
                const diaSem = d.getDay();
                const num = Number(dia.slice(8));
                const ehHoje = dia === hoje;
                return (
                  <th
                    key={dia}
                    className={cn(
                      "min-w-[44px] px-0.5 py-2 text-center text-[10px]",
                      diaSem === 0 || diaSem === 6
                        ? "text-slate-400 dark:text-slate-600"
                        : "text-slate-500 dark:text-slate-400",
                      ehHoje && "bg-brand-blue/5"
                    )}
                  >
                    <div className="font-normal">{DIAS_SEMANA[diaSem]}</div>
                    <div
                      className={cn(
                        "mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
                        ehHoje
                          ? "bg-brand-blue font-semibold text-white"
                          : "text-slate-400 dark:text-slate-500"
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
                className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
              >
                <td className="sticky left-0 z-10 bg-white px-4 py-2 dark:bg-slate-900">
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {u.nomeCompleto}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {u.setor}
                    {!u.temApp && (
                      <span className="ml-1 text-slate-300 dark:text-slate-600">· avulso</span>
                    )}
                  </p>
                </td>
                {diasDoMes.map((dia) => {
                  const e = mapa.get(`${u.id}_${dia}`);
                  const ativa =
                    selecao?.usuarioId === u.id && selecao?.data === dia;
                  const ehHoje = dia === hoje;
                  return (
                    <td
                      key={dia}
                      className={cn("px-0.5 py-1.5 text-center", ehHoje && "bg-brand-blue/5")}
                    >
                      <button
                        onClick={() => selecionar(u.id, dia)}
                        title={e ? ROTULOS_TIPO_DIA[e.tipo] : "Definir"}
                        className={cn(
                          "inline-flex h-7 w-10 items-center justify-center rounded-lg transition-all text-[10px] font-semibold",
                          ativa && "ring-2 ring-brand-blue ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                          e
                            ? CORES_CELULA[e.tipo] ?? "bg-slate-200 text-slate-600"
                            : "text-slate-200 hover:bg-slate-100 dark:text-slate-700 dark:hover:bg-slate-800"
                        )}
                      >
                        {e
                          ? e.tipo === "PLANTAO"
                            ? "PLT"
                            : e.tipo === "HOME_OFFICE"
                            ? "HO"
                            : e.tipo === "FOLGA"
                            ? "FOL"
                            : e.tipo === "SABADO_REDUZIDO"
                            ? "SR"
                            : "NOR"
                          : "+"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum colaborador cadastrado. Adicione um membro avulso →
          </p>
        )}
      </div>

      {/* Painel lateral */}
      <div className="flex w-full flex-col gap-3 lg:w-72">
        {/* Abas do painel */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setPainel("escala")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              painel === "escala"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Editar dia
          </button>
          <button
            onClick={() => setPainel("avulso")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              painel === "avulso"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            + Membro avulso
          </button>
        </div>

        {/* Painel: editar dia */}
        {painel === "escala" && (
          <Card>
            {selecao ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Editando
                  </p>
                  <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    {usuarios.find((u) => u.id === selecao.usuarioId)?.nomeCompleto}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {selecao.data.split("-").reverse().join("/")}
                  </p>
                </div>
                <Select
                  label="Tipo de dia"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {ROTULOS_TIPO_DIA[t]}
                    </option>
                  ))}
                </Select>
                <Textarea
                  label="Observação (opcional)"
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
                {erro && <p className="text-xs text-danger">{erro}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={salvar} loading={salvando}>
                    Salvar
                  </Button>
                  {mapa.has(`${selecao.usuarioId}_${selecao.data}`) && (
                    <Button size="sm" variant="danger" onClick={remover} disabled={salvando}>
                      Remover
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelecao(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  <svg
                    className="h-6 w-6 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
                    />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Clique numa célula da tabela para editar o dia de um colaborador.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Painel: membro avulso */}
        {painel === "avulso" && (
          <Card>
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Adicionar membro avulso
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Adiciona uma pessoa à escala sem criar login. Útil para membros da equipe
                  que ainda não usam o app.
                </p>
              </div>
              <Input
                label="Nome completo"
                placeholder="João Silva"
                value={nomeAvulso}
                onChange={(e) => setNomeAvulso(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionarAvulso()}
                autoFocus
              />
              <Input
                label="Setor (opcional)"
                placeholder="Operações"
                value={setorAvulso}
                onChange={(e) => setSetorAvulso(e.target.value)}
              />
              {erroAvulso && <p className="text-xs text-danger">{erroAvulso}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={adicionarAvulso}
                  loading={adicionando}
                  disabled={!nomeAvulso.trim()}
                >
                  Adicionar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPainel("escala")}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Legenda */}
        <Card className="py-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Legenda
          </p>
          <div className="flex flex-col gap-1.5">
            {TIPOS.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-8 items-center justify-center rounded text-[9px] font-semibold",
                    CORES_CELULA[t]
                  )}
                >
                  {t === "PLANTAO" ? "PLT" : t === "HOME_OFFICE" ? "HO" : t === "FOLGA" ? "FOL" : t === "SABADO_REDUZIDO" ? "SR" : "NOR"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {ROTULOS_TIPO_DIA[t]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
