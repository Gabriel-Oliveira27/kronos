"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "kronos_ps";

const ROTULOS_TIPO: Record<string, string> = {
  NORMAL: "Normal", PLANTAO: "Plantão", HOME_OFFICE: "Home office",
};

const RING_TIPO: Record<string, string> = {
  NORMAL: "ring-slate-400", PLANTAO: "ring-blue-500",
  HOME_OFFICE: "ring-green-500", FOLGA: "ring-amber-400",
};

interface EscalaItem {
  id: string; usuarioId: string; data: string; tipo: string; observacao: string | null;
  usuario: { id: string; nomeCompleto: string; setor: string; fotoUrl: string | null };
}
interface Usuario { id: string; nomeCompleto: string; setor: string; fotoUrl: string | null }

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function diasDoMes(mes: string): string[] {
  const [ano, m] = mes.split("-").map(Number);
  return Array.from({ length: new Date(ano, m, 0).getDate() }, (_, i) =>
    `${mes}-${String(i + 1).padStart(2, "0")}`
  );
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
function iniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

const CORES_AVATAR = ["bg-blue-500","bg-green-500","bg-purple-500","bg-amber-500","bg-red-500","bg-teal-500","bg-pink-500","bg-indigo-500"];

function AvatarPublico({ usuario, tipo, size = 20 }: { usuario: Usuario; tipo: string; size?: number }) {
  const ring = RING_TIPO[tipo] ?? "ring-slate-400";
  const corIdx = usuario.nomeCompleto.charCodeAt(0) % CORES_AVATAR.length;
  if (usuario.fotoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={usuario.fotoUrl} alt={usuario.nomeCompleto} title={`${usuario.nomeCompleto} · ${ROTULOS_TIPO[tipo] ?? tipo}`}
      className={`inline-flex shrink-0 rounded-full ring-2 object-cover ${ring}`} style={{ width: size, height: size }} />;
  }
  return (
    <span title={`${usuario.nomeCompleto} · ${ROTULOS_TIPO[tipo] ?? tipo}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ring-2 font-semibold text-white ${ring} ${CORES_AVATAR[corIdx]}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {iniciais(usuario.nomeCompleto)}
    </span>
  );
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function EscalaPublicaPage() {
  const [ps, setPs] = useState("");
  const [psInput, setPsInput] = useState("");
  const [mes, setMes] = useState(mesAtual);
  const [dados, setDados] = useState<{ escalas: EscalaItem[]; usuarios: Usuario[] } | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  useEffect(() => {
    const salva = sessionStorage.getItem(STORAGE_KEY) ?? "";
    if (salva) setPs(salva);
  }, []);

  const buscar = useCallback(async (palavraSecreta: string, mesBuscar: string) => {
    setCarregando(true); setErro(null);
    try {
      const res = await fetch(`/api/v1/escala-publica?ps=${encodeURIComponent(palavraSecreta)}&mes=${mesBuscar}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { setErro("Palavra secreta incorreta."); setPs(""); sessionStorage.removeItem(STORAGE_KEY); }
        else setErro(data?.error ?? "Não foi possível carregar a escala.");
        setDados(null); return;
      }
      setDados(data);
    } catch { setErro("Não foi possível conectar ao servidor."); setDados(null); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { if (ps) buscar(ps, mes); }, [ps, mes, buscar]);

  function autenticar() {
    if (!psInput.trim()) return;
    sessionStorage.setItem(STORAGE_KEY, psInput.trim()); setPs(psInput.trim());
  }

  // ── Tela de entrada da palavra secreta ──
  if (!ps) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 dark:bg-[#0B1220]">
        {/* Topo: home + tema */}
        <div className="mb-8 flex w-full max-w-sm items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Página inicial
          </Link>
          <ThemeToggle />
        </div>

        <Link href="/" className="mb-8"><Logo /></Link>
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-xl">
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Escala do plantão</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Digite a palavra secreta para visualizar a escala da equipe sem precisar fazer login.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            <Input label="Palavra secreta" type="password" placeholder="••••••••"
              value={psInput} onChange={(e) => setPsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && autenticar()} autoFocus error={erro ?? undefined} />
            <Button onClick={autenticar} disabled={!psInput.trim()}>Ver escala</Button>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-600">
          Colaborador? <Link href="/login" className="text-brand-blue hover:underline">Fazer login</Link>
        </p>
      </div>
    );
  }

  // ── Tela da escala ──
  const dias = diasDoMes(mes);
  const escalasMap = new Map<string, EscalaItem>();
  dados?.escalas.forEach((e) => escalasMap.set(`${e.usuarioId}_${e.data.slice(0, 10)}`, e));
  const usuarios = dados?.usuarios ?? [];

  // Offset para o calendário (qual dia da semana começa o mês)
  const offsetInicio = dias.length ? new Date(dias[0] + "T12:00:00Z").getUTCDay() : 0;
  const hoje = new Date().toISOString().slice(0, 10);

  // Escalas do dia selecionado para o painel lateral
  const escalasDoDia = diaSelecionado
    ? usuarios
        .map((u) => ({ u, e: escalasMap.get(`${u.id}_${diaSelecionado}`) }))
        .filter((x) => x.e)
    : [];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1220]">
      <header className="border-b border-slate-200 dark:border-slate-800/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">Visualização pública</span>
            <button onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setPs(""); setPsInput(""); setDados(null); }}
              className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Sair</button>
            <Link href="/login"><Button size="sm" variant="outline">Login</Button></Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Navegação de mês */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold capitalize text-slate-900 dark:text-white">{nomeDoMes(mes)}</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Escala da equipe — somente leitura</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setMes(m => moverMes(m, -1)); setDiaSelecionado(null); }}>← Mês anterior</Button>
            <Button variant="ghost" size="sm" onClick={() => { setMes(mesAtual()); setDiaSelecionado(null); }}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={() => { setMes(m => moverMes(m, 1)); setDiaSelecionado(null); }}>Próximo mês →</Button>
          </div>
        </div>

        {erro && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{erro}</div>
        )}
        {carregando && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        )}

        {!carregando && dados && (
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Lista de membros */}
            <div className="hidden w-44 shrink-0 lg:block">
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Equipe ({usuarios.length})
                  </p>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {usuarios.map((u) => (
                    <li key={u.id} className="flex items-center gap-2 px-3 py-2">
                      {u.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.fotoUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[9px] font-bold text-white">
                          {iniciais(u.nomeCompleto)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200" title={u.nomeCompleto}>{u.nomeCompleto}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{u.setor}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Calendário */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 grid grid-cols-7 gap-1">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="py-1 text-center text-[11px] font-medium tracking-wide text-slate-500">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: offsetInicio }).map((_, i) => (
                  <div key={`vazio-${i}`} className="min-h-[80px] rounded-lg bg-slate-100 dark:bg-slate-900/20" />
                ))}
                {dias.map((dia) => {
                  const numDia = Number(dia.slice(8));
                  const ehHoje = dia === hoje;
                  const ehSelecionado = dia === diaSelecionado;
                  const escaladosNoDia = usuarios
                    .map((u) => ({ u, e: escalasMap.get(`${u.id}_${dia}`) }))
                    .filter((x) => x.e);
                  return (
                    <button
                      key={dia}
                      onClick={() => setDiaSelecionado(ehSelecionado ? null : dia)}
                      className={cn(
                        "min-h-[80px] rounded-lg border p-1.5 text-left transition-all",
                        ehSelecionado ? "border-brand-blue bg-brand-blue/10 ring-2 ring-brand-blue/30"
                          : ehHoje ? "border-brand-blue/40 bg-brand-blue/5 dark:bg-brand-blue/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-900/40"
                      )}
                    >
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                        ehHoje ? "bg-brand-blue font-bold text-white" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {numDia}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {escaladosNoDia.slice(0, 6).map(({ u, e }) => (
                          <AvatarPublico key={u.id} usuario={u} tipo={e!.tipo} size={18} />
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
                {Object.entries(ROTULOS_TIPO).map(([tipo, rotulo]) => (
                  <span key={tipo} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={cn("h-2.5 w-2.5 rounded-full ring-2", RING_TIPO[tipo])} />
                    {rotulo}
                  </span>
                ))}
              </div>
            </div>

            {/* Painel lateral do dia selecionado */}
            <div className="w-full lg:w-72 lg:shrink-0">
              {diaSelecionado ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Dia selecionado</p>
                  <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {new Date(diaSelecionado + "T12:00:00Z").toLocaleDateString("pt-BR", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </p>
                  {escalasDoDia.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-3">
                      {escalasDoDia.map(({ u, e }) => (
                        <div key={u.id} className="flex items-center gap-2">
                          <AvatarPublico usuario={u} tipo={e!.tipo} size={28} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{u.nomeCompleto}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{ROTULOS_TIPO[e!.tipo] ?? e!.tipo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Nenhuma escala atribuída neste dia.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-10 text-center dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                    <svg className="h-6 w-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Clique em um dia para ver quem está escalado.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
