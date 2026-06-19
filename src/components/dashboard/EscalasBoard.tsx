"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

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

const TIPOS = [
  { valor: "NORMAL",          sigla: "NOR", label: "Normal",          cor: "bg-slate-400 dark:bg-slate-600" },
  { valor: "PLANTAO",         sigla: "PLT", label: "Plantão",         cor: "bg-brand-blue" },
  { valor: "HOME_OFFICE",     sigla: "HO",  label: "Home office",     cor: "bg-brand-green" },
  { valor: "FOLGA",           sigla: "FOL", label: "Folga",           cor: "bg-amber-400" },
  { valor: "SABADO_REDUZIDO", sigla: "SR",  label: "Sáb. reduzido",   cor: "bg-slate-300 dark:bg-slate-700" },
] as const;

// Cores para os mini-indicadores dentro das células do calendário
const COR_PONTO: Record<string, string> = {
  NORMAL:          "bg-slate-400",
  PLANTAO:         "bg-blue-500",
  HOME_OFFICE:     "bg-green-500",
  FOLGA:           "bg-amber-400",
  SABADO_REDUZIDO: "bg-slate-300",
};

// Cores dos botões de ação rápida no painel da direita (quando ativo)
const COR_ATIVO: Record<string, string> = {
  NORMAL:          "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  PLANTAO:         "bg-blue-500 text-white",
  HOME_OFFICE:     "bg-green-500 text-white",
  FOLGA:           "bg-amber-400 text-amber-950",
  SABADO_REDUZIDO: "bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-white",
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function EscalasBoard({
  usuarios: usuariosIniciais,
  escalasIniciais,
  diasDoMes,
  mesAtivo,
}: {
  usuarios: UsuarioResumo[];
  escalasIniciais: EscalaView[];
  diasDoMes: string[];
  mesAtivo: string;
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [escalas, setEscalas] = useState(escalasIniciais);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null);

  // Formulário de membro avulso
  const [mostrarAvulso, setMostrarAvulso] = useState(false);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [setorAvulso, setSetorAvulso] = useState("Geral");
  const [adicionando, setAdicionando] = useState(false);
  const [erroAvulso, setErroAvulso] = useState<string | null>(null);

  // Mapa O(1) para lookup: "usuarioId_YYYY-MM-DD" → EscalaView
  const mapa = useMemo(() => {
    const m = new Map<string, EscalaView>();
    for (const e of escalas) {
      m.set(`${e.usuarioId}_${e.data.slice(0, 10)}`, e);
    }
    return m;
  }, [escalas]);

  // Offset de células vazias: qual dia da semana começa o mês?
  // Usa T12:00:00Z para evitar ambiguidade de timezone.
  const offsetInicio = useMemo(() => {
    if (!diasDoMes.length) return 0;
    return new Date(diasDoMes[0] + "T12:00:00Z").getUTCDay(); // 0=Dom
  }, [diasDoMes]);

  const hoje = new Date().toISOString().slice(0, 10);

  // ───── Ações ─────

  async function definirTipo(usuarioId: string, data: string, tipo: string) {
    const chave = `${usuarioId}_${data}`;
    const existente = mapa.get(chave);

    // Clicar no tipo já ativo → remove
    if (existente?.tipo === tipo) {
      await removerEscala(existente.id, usuarioId, data);
      return;
    }

    setSalvandoChave(chave);
    try {
      const res = await fetch("/api/v1/escalas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, data, tipo, observacao: "" }),
      });
      if (res.ok) {
        const json = await res.json();
        setEscalas((prev) => [
          ...prev.filter(
            (e) => !(e.usuarioId === usuarioId && e.data.slice(0, 10) === data)
          ),
          json,
        ]);
      }
    } finally {
      setSalvandoChave(null);
    }
  }

  async function removerEscala(id: string, usuarioId: string, data: string) {
    const chave = `${usuarioId}_${data}`;
    setSalvandoChave(chave);
    try {
      const res = await fetch(`/api/v1/escalas/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEscalas((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setSalvandoChave(null);
    }
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
      const json = await res.json();
      if (!res.ok) { setErroAvulso(json?.error ?? "Não foi possível adicionar."); return; }
      setUsuarios((prev) => [
        ...prev,
        { id: json.id, nomeCompleto: json.nomeCompleto, setor: json.setor, temApp: false },
      ]);
      setNomeAvulso("");
      setSetorAvulso("Geral");
      setMostrarAvulso(false);
    } catch { setErroAvulso("Erro de conexão."); }
    finally { setAdicionando(false); }
  }

  // ───── Renderização ─────

  return (
    <div className="flex gap-4">

      {/* ── Coluna esquerda: lista da equipe ── */}
      <div className="hidden w-44 shrink-0 flex-col gap-2 lg:flex">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Equipe ({usuarios.length})
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {usuarios.map((u) => (
              <li key={u.id} className="px-3 py-2">
                <p
                  className="truncate text-xs font-medium text-slate-800 dark:text-slate-100"
                  title={u.nomeCompleto}
                >
                  {u.nomeCompleto}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {u.setor}
                  {!u.temApp && " · avulso"}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Adicionar avulso */}
        {!mostrarAvulso ? (
          <button
            onClick={() => setMostrarAvulso(true)}
            className="rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-brand-blue hover:text-brand-blue dark:border-slate-700 dark:text-slate-400 transition-colors"
          >
            + Membro avulso
          </button>
        ) : (
          <Card className="flex flex-col gap-3 p-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Membro avulso
            </p>
            <Input
              placeholder="Nome"
              value={nomeAvulso}
              onChange={(e) => setNomeAvulso(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionarAvulso()}
              autoFocus
              className="h-8 text-xs"
            />
            <Input
              placeholder="Setor (opcional)"
              value={setorAvulso}
              onChange={(e) => setSetorAvulso(e.target.value)}
              className="h-8 text-xs"
            />
            {erroAvulso && <p className="text-[11px] text-danger">{erroAvulso}</p>}
            <div className="flex gap-1.5">
              <Button size="sm" onClick={adicionarAvulso} loading={adicionando} disabled={!nomeAvulso.trim()} className="flex-1 text-xs">
                Adicionar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMostrarAvulso(false)} className="text-xs">
                ×
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* ── Centro: calendário mensal ── */}
      <div className="min-w-0 flex-1">
        {/* Cabeçalho dos dias da semana */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 gap-1">
          {/* Células vazias antes do dia 1 */}
          {Array.from({ length: offsetInicio }).map((_, i) => (
            <div
              key={`vazio-${i}`}
              className="min-h-[72px] rounded-lg bg-slate-50 dark:bg-slate-900/20"
            />
          ))}

          {/* Dias do mês */}
          {diasDoMes.map((dia) => {
            const numDia = Number(dia.slice(8));
            const ehHoje = dia === hoje;
            const ehSelecionado = dia === diaSelecionado;

            // Mini-indicadores: um ponto colorido por usuário escalado
            const escaladosNoDia = usuarios
              .map((u) => ({ u, e: mapa.get(`${u.id}_${dia}`) }))
              .filter((x) => x.e);

            return (
              <button
                key={dia}
                onClick={() => setDiaSelecionado(ehSelecionado ? null : dia)}
                className={cn(
                  "min-h-[72px] rounded-lg border p-1.5 text-left transition-all",
                  ehSelecionado
                    ? "border-brand-blue bg-brand-blue/5 ring-2 ring-brand-blue/30 dark:bg-brand-blue/10"
                    : ehHoje
                    ? "border-brand-blue/40 bg-brand-blue/5 dark:bg-brand-blue/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                )}
              >
                {/* Número do dia */}
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                    ehHoje
                      ? "bg-brand-blue font-bold text-white"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {numDia}
                </span>

                {/* Indicadores de usuários */}
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {escaladosNoDia.slice(0, 8).map(({ u, e }) => (
                    <span
                      key={u.id}
                      title={`${u.nomeCompleto}: ${e!.tipo}`}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        COR_PONTO[e!.tipo] ?? "bg-slate-400"
                      )}
                    />
                  ))}
                  {escaladosNoDia.length > 8 && (
                    <span className="text-[9px] text-slate-400">
                      +{escaladosNoDia.length - 8}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap gap-3">
          {TIPOS.map((t) => (
            <span key={t.valor} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className={cn("h-2.5 w-2.5 rounded-full", COR_PONTO[t.valor])} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Coluna direita: painel de ações ── */}
      <div className="w-72 shrink-0">
        {diaSelecionado ? (
          <Card className="p-4">
            {/* Cabeçalho do dia */}
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Editando
              </p>
              <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {new Date(diaSelecionado + "T12:00:00Z").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            {/* Lista de usuários com botões de tipo rápido */}
            <div className="flex flex-col gap-4">
              {usuarios.map((u) => {
                const chave = `${u.id}_${diaSelecionado}`;
                const escala = mapa.get(chave);
                const carregando = salvandoChave === chave;

                return (
                  <div key={u.id}>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <p
                        className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100"
                        title={u.nomeCompleto}
                      >
                        {u.nomeCompleto}
                      </p>
                      {escala && (
                        <button
                          onClick={() => removerEscala(escala.id, u.id, diaSelecionado)}
                          disabled={carregando}
                          title="Remover escala deste dia"
                          className="text-slate-300 hover:text-danger dark:text-slate-600 dark:hover:text-danger transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Botões de tipo rápido */}
                    <div className="flex flex-wrap gap-1">
                      {TIPOS.map((t) => {
                        const ativo = escala?.tipo === t.valor;
                        return (
                          <button
                            key={t.valor}
                            onClick={() => definirTipo(u.id, diaSelecionado, t.valor)}
                            disabled={carregando}
                            title={t.label}
                            className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-semibold transition-all",
                              ativo
                                ? COR_ATIVO[t.valor]
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
                              carregando && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {carregando && ativo ? "..." : t.sigla}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[10px] text-slate-400 dark:text-slate-500">
              Clique no tipo para atribuir. Clique novamente para remover.
            </p>
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Clique em um dia do calendário para editar as escalas da equipe.
            </p>

            {/* Adicionar avulso — visível em mobile (sem sidebar) */}
            <button
              onClick={() => setMostrarAvulso(!mostrarAvulso)}
              className="mt-2 text-xs font-medium text-brand-blue hover:underline lg:hidden"
            >
              + Membro avulso
            </button>

            {mostrarAvulso && (
              <div className="mt-3 w-full border-t border-slate-200 pt-4 dark:border-slate-800 lg:hidden">
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="Nome"
                    value={nomeAvulso}
                    onChange={(e) => setNomeAvulso(e.target.value)}
                    autoFocus
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Setor (opcional)"
                    value={setorAvulso}
                    onChange={(e) => setSetorAvulso(e.target.value)}
                    className="h-8 text-xs"
                  />
                  {erroAvulso && <p className="text-[11px] text-danger">{erroAvulso}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={adicionarAvulso} loading={adicionando} disabled={!nomeAvulso.trim()} className="flex-1 text-xs">
                      Adicionar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMostrarAvulso(false)} className="text-xs">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
