"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, horarioDoTipo } from "@/lib/utils";

interface Registro { id: string; data: string; tipoEvento: string; horarioReal: string | null; confirmado: boolean; origem: string }
interface EscalaItem { data: string; tipo: string }

const TIPOS_EVENTO = ["ENTRADA","SAIDA","ENTRADA_INTERVALO","SAIDA_INTERVALO","EXTRA"] as const;
type TipoEvento = typeof TIPOS_EVENTO[number];

const ROTULO_TIPO: Record<string, string> = {
  ENTRADA:"Entrada", SAIDA:"Saída", ENTRADA_INTERVALO:"Ret. intervalo",
  SAIDA_INTERVALO:"Saída intervalo", EXTRA:"Extra",
};

// Sábado vale 4h na jornada semanal de 44h (8h × seg–sex + 4h no sábado).
const HORAS_SABADO = 4;

function ehSabadoDia(dia: string): boolean {
  return new Date(dia + "T12:00:00Z").getUTCDay() === 6;
}

/**
 * Meta de horas do dia para o cálculo de saldo. Retorna `null` quando o dia
 * NÃO entra no cálculo. Regras de negócio:
 *  - Plantão / Home office → abonados, fora do cálculo (null).
 *  - Sábado (expediente ou folga) → 4h. Folga no sábado vira débito de 4h.
 *  - Folga em dia de semana → não gera débito (null).
 *  - Dia normal de semana → jornada diária (8h).
 *  - Dia sem escala e sem batidas → ignorado (null).
 */
function metaDoDia(
  tipo: string | undefined,
  dia: string,
  jornadaDiaria: number,
  temBatidas: boolean
): number | null {
  if (tipo === "PLANTAO" || tipo === "HOME_OFFICE") return null;
  if (ehSabadoDia(dia)) {
    if (tipo === "FOLGA" || tipo === "NORMAL" || temBatidas) return HORAS_SABADO;
    return null;
  }
  if (tipo === "FOLGA") return null;
  if (!tipo && !temBatidas) return null;
  return jornadaDiaria;
}

function horaParaMinutos(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}
function minutosParaHora(m: number): string {
  const neg = m < 0;
  const abs = Math.abs(m);
  return `${neg?"-":""}${String(Math.floor(abs/60)).padStart(2,"0")}:${String(abs%60).padStart(2,"0")}`;
}

function calcularHorasDia(regs: Registro[]): number {
  const entradas = regs.filter(r => r.tipoEvento === "ENTRADA" || r.tipoEvento === "ENTRADA_INTERVALO")
    .map(r => r.horarioReal).filter(Boolean).sort();
  const saidas = regs.filter(r => r.tipoEvento === "SAIDA" || r.tipoEvento === "SAIDA_INTERVALO")
    .map(r => r.horarioReal).filter(Boolean).sort();
  let total = 0;
  for (let i = 0; i < Math.min(entradas.length, saidas.length); i++) {
    total += horaParaMinutos(saidas[i]!) - horaParaMinutos(entradas[i]!);
  }
  return total / 60;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

export function PontoBoard({ registrosIniciais, escalaDoMes, mesInicial, jornadaDiaria }: {
  registrosIniciais: Registro[];
  escalaDoMes: EscalaItem[];
  mesInicial: string;
  jornadaDiaria: number;
}) {
  const [registros, setRegistros] = useState(registrosIniciais);
  const [mes, setMes] = useState(mesInicial);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [novoTipo, setNovoTipo] = useState<TipoEvento>("ENTRADA");
  const [novoHorario, setNovoHorario] = useState("");
  const [novaData, setNovaData] = useState(() => new Date().toISOString().slice(0,10));
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editHorario, setEditHorario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [verMes, setVerMes] = useState(false);

  const mapaDias = useMemo(() => {
    const m = new Map<string, Registro[]>();
    registros.forEach(r => {
      const d = r.data.slice(0,10);
      m.set(d, [...(m.get(d) ?? []), r]);
    });
    return m;
  }, [registros]);

  const escalaMap = useMemo(() => {
    const m = new Map<string, string>();
    escalaDoMes.forEach(e => m.set(e.data.slice(0,10), e.tipo));
    return m;
  }, [escalaDoMes]);

  const diasDoMes = useMemo(() => {
    const [ano, m] = mes.split("-").map(Number);
    const ultimo = new Date(ano, m, 0).getDate();
    return Array.from({length:ultimo},(_,i) => `${mes}-${String(i+1).padStart(2,"0")}`);
  }, [mes]);

  // Relatório do mês
  const relatorio = useMemo(() => {
    let trabalhadas = 0, previstas = 0;
    diasDoMes.forEach(dia => {
      const tipo = escalaMap.get(dia);
      const regs = mapaDias.get(dia) ?? [];
      const meta = metaDoDia(tipo, dia, jornadaDiaria, regs.length > 0);
      if (meta === null) return; // plantão/home office/folga de semana: fora do cálculo
      previstas += meta;
      trabalhadas += calcularHorasDia(regs);
    });
    return { trabalhadas, previstas, saldo: trabalhadas - previstas };
  }, [diasDoMes, mapaDias, escalaMap, jornadaDiaria]);

  async function registrar() {
    setSalvando(true); setErro(null);
    try {
      const res = await fetch("/api/v1/ponto", { method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ data: new Date(novaData+"T12:00:00Z"), tipoEvento: novoTipo, horarioReal: novoHorario }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json?.error ?? "Erro ao registrar."); return; }
      setRegistros(r => [...r, json].sort((a,b) => a.data.localeCompare(b.data) || (a.horarioReal ?? "").localeCompare(b.horarioReal ?? "")));
      setNovoHorario(""); setAdicionando(false);
    } catch { setErro("Erro de conexão."); }
    finally { setSalvando(false); }
  }

  async function salvarEdicao(id: string, data: string) {
    setSalvando(true); setErro(null);
    try {
      const reg = registros.find(r => r.id === id)!;
      const res = await fetch(`/api/v1/ponto/${id}`, { method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ data: new Date(data+"T12:00:00Z"), tipoEvento: reg.tipoEvento, horarioReal: editHorario }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json?.error ?? "Erro ao editar."); return; }
      setRegistros(r => r.map(reg => reg.id === id ? json : reg));
      setEditandoId(null);
    } catch { setErro("Erro de conexão."); }
    finally { setSalvando(false); }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este registro?")) return;
    const res = await fetch(`/api/v1/ponto/${id}`, { method:"DELETE" });
    if (res.ok) setRegistros(r => r.filter(reg => reg.id !== id));
  }

  const hoje = new Date().toISOString().slice(0,10);
  const diasComRegistro = diasDoMes.filter(d => mapaDias.has(d)).sort().reverse();

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho mês + relatório */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label:"Horas trabalhadas", valor: minutosParaHora(relatorio.trabalhadas*60), cor:"text-slate-900 dark:text-white" },
          { label:"Horas previstas",   valor: minutosParaHora(relatorio.previstas*60),   cor:"text-slate-900 dark:text-white" },
          { label:"Saldo",             valor: minutosParaHora(relatorio.saldo*60), cor: relatorio.saldo >= 0 ? "text-brand-green-dark dark:text-brand-green" : "text-danger" },
        ].map(({ label, valor, cor }) => (
          <Card key={label}>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">{label}</p>
            <p className={cn("mt-2 font-display text-2xl font-semibold font-mono", cor)}>{valor}</p>
          </Card>
        ))}
        <Card className="flex items-center justify-center">
          <Button variant="outline" size="sm" onClick={() => setVerMes(v => !v)}>
            {verMes ? "Ocultar histórico" : "Ver histórico do mês"}
          </Button>
        </Card>
      </div>

      {/* Formulário de novo registro */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-slate-900 dark:text-white">Registrar batida</p>
          <Button size="sm" onClick={() => setAdicionando(v => !v)}>
            {adicionando ? "Cancelar" : "+ Adicionar"}
          </Button>
        </div>
        {adicionando && (
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Data</label>
              <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Tipo</label>
              <select value={novoTipo} onChange={e => setNovoTipo(e.target.value as TipoEvento)}
                className="mt-1 h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {TIPOS_EVENTO.map(t => <option key={t} value={t}>{ROTULO_TIPO[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Horário</label>
              <Input type="time" value={novoHorario} onChange={e => setNovoHorario(e.target.value)} className="h-9 mt-1" />
            </div>
            <Button onClick={registrar} loading={salvando} disabled={!novoHorario} size="sm">Salvar</Button>
            {erro && <p className="text-xs text-danger w-full">{erro}</p>}
          </div>
        )}
      </Card>

      {/* Dia de hoje */}
      <DiaCard
        dia={hoje} registros={mapaDias.get(hoje) ?? []} tipo={escalaMap.get(hoje)}
        jornadaDiaria={jornadaDiaria} editandoId={editandoId} editHorario={editHorario}
        onEditar={(id,h) => { setEditandoId(id); setEditHorario(h); }}
        onSalvarEdicao={id => salvarEdicao(id, hoje)}
        onCancelarEdicao={() => setEditandoId(null)}
        onExcluir={excluir} salvando={salvando} label="Hoje" destaque
      />

      {/* Histórico do mês */}
      {verMes && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-slate-700 dark:text-slate-200">Histórico — {mes}</p>
          {diasComRegistro.filter(d => d !== hoje).map(dia => (
            <DiaCard key={dia} dia={dia} registros={mapaDias.get(dia) ?? []} tipo={escalaMap.get(dia)}
              jornadaDiaria={jornadaDiaria} editandoId={editandoId} editHorario={editHorario}
              onEditar={(id,h) => { setEditandoId(id); setEditHorario(h); }}
              onSalvarEdicao={id => salvarEdicao(id, dia)}
              onCancelarEdicao={() => setEditandoId(null)}
              onExcluir={excluir} salvando={salvando}
            />
          ))}
          {diasComRegistro.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">Nenhum registro neste mês.</p>
          )}
        </div>
      )}
    </div>
  );
}

function DiaCard({ dia, registros, tipo, jornadaDiaria, editandoId, editHorario,
  onEditar, onSalvarEdicao, onCancelarEdicao, onExcluir, salvando, label, destaque }: {
  dia: string; registros: Registro[]; tipo?: string;
  jornadaDiaria: number; editandoId: string | null; editHorario: string;
  onEditar: (id: string, h: string) => void;
  onSalvarEdicao: (id: string) => void;
  onCancelarEdicao: () => void;
  onExcluir: (id: string) => void;
  salvando: boolean; label?: string; destaque?: boolean;
}) {
  const meta = metaDoDia(tipo, dia, jornadaDiaria, registros.length > 0);
  const horas = calcularHorasDia(registros);
  const saldo = meta === null ? null : horas - meta;
  const sabadoFolga = ehSabadoDia(dia) && tipo === "FOLGA";
  const dataFmt = new Date(dia+"T12:00:00Z").toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" });

  return (
    <Card className={destaque ? "border-brand-blue/30 bg-brand-blue/5 dark:bg-brand-blue/10" : ""}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white capitalize">
            {label ?? dataFmt}
          </p>
          {label && <p className="text-xs text-slate-500 capitalize">{dataFmt}</p>}
        </div>
        <div className="flex items-center gap-3">
          {tipo && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {tipo === "PLANTAO" ? "Plantão" : tipo === "HOME_OFFICE" ? "Home office" : tipo === "FOLGA" ? "Folga" : "Normal"}
            </span>
          )}
          {horarioDoTipo(tipo) && (
            <span className="font-mono text-xs font-medium text-brand-green-dark dark:text-brand-green">
              {horarioDoTipo(tipo)}
            </span>
          )}
          {saldo !== null && (registros.length > 0 || sabadoFolga) && (
            <span className={cn("font-mono text-sm font-semibold", saldo >= 0 ? "text-brand-green-dark dark:text-brand-green" : "text-danger")}>
              {saldo >= 0 ? "+" : ""}{minutosParaHora(saldo*60)}
            </span>
          )}
        </div>
      </div>

      {registros.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma batida registrada.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {registros.map(r => (
            <div key={r.id} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/60">
              {editandoId === r.id ? (
                <>
                  <input type="time" value={editHorario}
                    className="h-7 w-24 rounded border border-slate-300 bg-white px-1 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={e => onEditar(r.id, e.target.value)}
                  />
                  <button onClick={() => onSalvarEdicao(r.id)} disabled={salvando}
                    className="text-xs font-medium text-brand-green-dark hover:underline">✓</button>
                  <button onClick={onCancelarEdicao} className="text-xs text-slate-400 hover:text-slate-700">✕</button>
                </>
              ) : (
                <>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{r.horarioReal}</span>
                  <span className="text-[10px] text-slate-400">{ROTULO_TIPO[r.tipoEvento] ?? r.tipoEvento}</span>
                  {r.origem === "web" && <span className="text-[9px] text-slate-300 dark:text-slate-600">web</span>}
                  <button onClick={() => onEditar(r.id, r.horarioReal ?? "")}
                    className="ml-1 text-slate-300 hover:text-brand-blue dark:text-slate-600">
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                      <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button onClick={() => onExcluir(r.id)}
                    className="text-slate-300 hover:text-danger dark:text-slate-600">
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                      <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
