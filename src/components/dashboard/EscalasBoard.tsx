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
  fotoUrl: string | null;
}

export interface EscalaView {
  id: string;
  usuarioId: string;
  data: string;
  tipo: string;
  observacao: string | null;
}

const TIPOS = [
  { valor: "NORMAL",          sigla: "NOR", label: "Normal",        cor: "bg-slate-400 dark:bg-slate-600" },
  { valor: "PLANTAO",         sigla: "PLT", label: "Plantão",       cor: "bg-brand-blue" },
  { valor: "HOME_OFFICE",     sigla: "HO",  label: "Home office",   cor: "bg-brand-green" },
  { valor: "FOLGA",           sigla: "FOL", label: "Folga",         cor: "bg-amber-400" },
] as const;

// Ring colorido nos avatares indicando o tipo de escala
const RING_TIPO: Record<string, string> = {
  NORMAL:          "ring-slate-400",
  PLANTAO:         "ring-blue-500",
  HOME_OFFICE:     "ring-green-500",
  FOLGA:           "ring-amber-400",
};

// Fundo dos botões de tipo rápido quando ativo
const COR_ATIVO: Record<string, string> = {
  NORMAL:          "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  PLANTAO:         "bg-blue-500 text-white",
  HOME_OFFICE:     "bg-green-500 text-white",
  FOLGA:           "bg-amber-400 text-amber-950",
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Retorna as iniciais de um nome (até 2 letras). */
function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

/** Avatar circular — foto se disponível, senão iniciais com fundo colorido. */
function Avatar({
  usuario,
  tipo,
  size = 20,
}: {
  usuario: UsuarioResumo;
  tipo: string;
  size?: number;
}) {
  const ring = RING_TIPO[tipo] ?? "ring-slate-400";
  const cls = `inline-flex shrink-0 items-center justify-center rounded-full ring-2 ${ring} overflow-hidden`;

  if (usuario.fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={usuario.fotoUrl}
        alt={usuario.nomeCompleto}
        title={`${usuario.nomeCompleto} · ${tipo}`}
        width={size}
        height={size}
        className={cls}
        style={{ width: size, height: size }}
      />
    );
  }

  // Paleta de cores por inicial para diferenciar avatares sem foto
  const cores = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-red-500",
    "bg-teal-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  const corIdx = usuario.nomeCompleto.charCodeAt(0) % cores.length;

  return (
    <span
      title={`${usuario.nomeCompleto} · ${tipo}`}
      className={`${cls} ${cores[corIdx]} text-white font-semibold`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {iniciais(usuario.nomeCompleto)}
    </span>
  );
}

export function EscalasBoard({
  usuarios: usuariosIniciais,
  escalasIniciais,
  diasDoMes,
}: {
  usuarios: UsuarioResumo[];
  escalasIniciais: EscalaView[];
  diasDoMes: string[];
  mesAtivo?: string;
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

  // Mapa O(1): "usuarioId_YYYY-MM-DD" → EscalaView
  const mapa = useMemo(() => {
    const m = new Map<string, EscalaView>();
    for (const e of escalas) {
      m.set(`${e.usuarioId}_${e.data.slice(0, 10)}`, e);
    }
    return m;
  }, [escalas]);

  // Offset de células vazias antes do dia 1 do mês
  const offsetInicio = useMemo(() => {
    if (!diasDoMes.length) return 0;
    // T12:00:00Z evita ambiguidade de timezone no getUTCDay
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
      if (res.ok) setEscalas((prev) => prev.filter((e) => e.id !== id));
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
        { id: json.id, nomeCompleto: json.nomeCompleto, setor: json.setor, temApp: false, fotoUrl: null },
      ]);
      setNomeAvulso("");
      setSetorAvulso("Geral");
      setMostrarAvulso(false);
    } catch { setErroAvulso("Erro de conexão."); }
    finally { setAdicionando(false); }
  }

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
              <li key={u.id} className="flex items-center gap-2 px-3 py-2">
                {/* Mini avatar na lista */}
                {u.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.fotoUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[9px] font-bold text-white">
                    {iniciais(u.nomeCompleto)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100" title={u.nomeCompleto}>
                    {u.nomeCompleto}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {u.setor}{!u.temApp && " · avulso"}
                  </p>
                </div>
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
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Membro avulso</p>
            <Input placeholder="Nome" value={nomeAvulso} onChange={(e) => setNomeAvulso(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionarAvulso()} autoFocus className="h-8 text-xs" />
            <Input placeholder="Setor (opcional)" value={setorAvulso} onChange={(e) => setSetorAvulso(e.target.value)} className="h-8 text-xs" />
            {erroAvulso && <p className="text-[11px] text-danger">{erroAvulso}</p>}
            <div className="flex gap-1.5">
              <Button size="sm" onClick={adicionarAvulso} loading={adicionando} disabled={!nomeAvulso.trim()} className="flex-1 text-xs">
                Adicionar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMostrarAvulso(false)} className="text-xs">×</Button>
            </div>
          </Card>
        )}
      </div>

      {/* ── Centro: calendário mensal ── */}
      <div className="min-w-0 flex-1">
        {/* Cabeçalho dos dias da semana */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
              {d}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 gap-1">
          {/* Células vazias antes do dia 1 */}
          {Array.from({ length: offsetInicio }).map((_, i) => (
            <div key={`vazio-${i}`} className="min-h-[80px] rounded-lg bg-slate-50 dark:bg-slate-900/20" />
          ))}

          {/* Dias do mês */}
          {diasDoMes.map((dia) => {
            const numDia = Number(dia.slice(8));
            const ehHoje = dia === hoje;
            const ehSelecionado = dia === diaSelecionado;

            // Usuários escalados neste dia
            const escaladosNoDia = usuarios
              .map((u) => ({ u, e: mapa.get(`${u.id}_${dia}`) }))
              .filter((x) => x.e);

            return (
              <button
                key={dia}
                onClick={() => setDiaSelecionado(ehSelecionado ? null : dia)}
                className={cn(
                  "min-h-[80px] rounded-lg border p-1.5 text-left transition-all",
                  ehSelecionado
                    ? "border-brand-blue bg-brand-blue/5 ring-2 ring-brand-blue/30 dark:bg-brand-blue/10"
                    : ehHoje
                    ? "border-brand-blue/40 bg-brand-blue/5 dark:bg-brand-blue/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                )}
              >
                {/* Número do dia */}
                <span className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                  ehHoje ? "bg-brand-blue font-bold text-white" : "text-slate-500 dark:text-slate-400"
                )}>
                  {numDia}
                </span>

                {/* Avatares dos usuários escalados */}
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {escaladosNoDia.slice(0, 6).map(({ u, e }) => (
                    <Avatar key={u.id} usuario={u} tipo={e!.tipo} size={18} />
                  ))}
                  {escaladosNoDia.length > 6 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-200 px-1 text-[9px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      +{escaladosNoDia.length - 6}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap gap-4">
          {TIPOS.map((t) => (
            <span key={t.valor} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className={cn("h-2.5 w-2.5 rounded-full ring-2", RING_TIPO[t.valor])} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Coluna direita: painel de ações ── */}
      <div className="w-72 shrink-0">
        {diaSelecionado ? (
          <Card className="p-4">
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Editando</p>
              <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {new Date(diaSelecionado + "T12:00:00Z").toLocaleDateString("pt-BR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {usuarios.map((u) => {
                const chave = `${u.id}_${diaSelecionado}`;
                const escala = mapa.get(chave);
                const carregando = salvandoChave === chave;

                return (
                  <div key={u.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {/* Avatar no painel lateral */}
                        {escala ? (
                          <Avatar usuario={u} tipo={escala.tipo} size={20} />
                        ) : u.fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.fotoUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover opacity-40" />
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-500 dark:bg-slate-700">
                            {iniciais(u.nomeCompleto)}
                          </span>
                        )}
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100" title={u.nomeCompleto}>
                          {u.nomeCompleto}
                        </p>
                      </div>
                      {escala && (
                        <button
                          onClick={() => removerEscala(escala.id, u.id, diaSelecionado)}
                          disabled={carregando}
                          title="Remover escala"
                          className="shrink-0 text-slate-300 hover:text-danger dark:text-slate-600 dark:hover:text-danger transition-colors"
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
                              ativo ? COR_ATIVO[t.valor] : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
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
            {/* Adicionar avulso mobile */}
            <button onClick={() => setMostrarAvulso(!mostrarAvulso)} className="mt-2 text-xs font-medium text-brand-blue hover:underline lg:hidden">
              + Membro avulso
            </button>
            {mostrarAvulso && (
              <div className="mt-3 w-full border-t border-slate-200 pt-4 dark:border-slate-800 lg:hidden">
                <div className="flex flex-col gap-3">
                  <Input placeholder="Nome" value={nomeAvulso} onChange={(e) => setNomeAvulso(e.target.value)} autoFocus className="h-8 text-xs" />
                  <Input placeholder="Setor (opcional)" value={setorAvulso} onChange={(e) => setSetorAvulso(e.target.value)} className="h-8 text-xs" />
                  {erroAvulso && <p className="text-[11px] text-danger">{erroAvulso}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={adicionarAvulso} loading={adicionando} disabled={!nomeAvulso.trim()} className="flex-1 text-xs">Adicionar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setMostrarAvulso(false)} className="text-xs">Cancelar</Button>
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
