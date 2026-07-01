"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface Aviso { hora: string; mensagem: string; dias?: string[] }
interface ConfiguracaoDias { seg?:number;ter?:number;qua?:number;qui?:number;sex?:number;sab?:number;dom?:number }
interface Configuracao { diasUteis?: ConfiguracaoDias; avisos?: Aviso[] }
interface ModeloView {
  id: string; nome: string; descricao: string | null;
  horasSemanais: number; jornadaDiaria: number; jornadaPlantao?: number;
  configuracao: Configuracao | null;
  criadoEm: string; _count: { usuarios: number }
}

const DIAS_SEMANA = [
  { chave: "seg", label: "Seg" }, { chave: "ter", label: "Ter" }, { chave: "qua", label: "Qua" },
  { chave: "qui", label: "Qui" }, { chave: "sex", label: "Sex" }, { chave: "sab", label: "Sáb" },
  { chave: "dom", label: "Dom" },
] as const;

function rotuloDias(dias?: string[]): string {
  if (!dias || dias.length === 0) return "todos os dias";
  return DIAS_SEMANA.filter(d => dias.includes(d.chave)).map(d => d.label).join(", ");
}

function FormModelo({ inicial, onSalvar, onCancelar }: {
  inicial?: Partial<ModeloView>; onSalvar: (dados: unknown) => Promise<void>; onCancelar: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [horasSemanais, setHorasSemanais] = useState(String(inicial?.horasSemanais ?? 44));
  const [jornadaDiaria, setJornadaDiaria] = useState(String(inicial?.jornadaDiaria ?? 8));
  const [jornadaPlantao, setJornadaPlantao] = useState(String(inicial?.jornadaPlantao ?? 7.5));
  const [diasUteis, setDiasUteis] = useState<ConfiguracaoDias>(inicial?.configuracao?.diasUteis ?? {});
  const [avisos, setAvisos] = useState<Aviso[]>(inicial?.configuracao?.avisos ?? []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setSalvando(true); setErro(null);
    try {
      await onSalvar({
        nome, descricao: descricao || null,
        horasSemanais: Number(horasSemanais), jornadaDiaria: Number(jornadaDiaria),
        jornadaPlantao: Number(jornadaPlantao),
        configuracao: { diasUteis, avisos },
      });
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao salvar."); }
    finally { setSalvando(false); }
  }

  function adicionarAviso() { setAvisos(a => [...a, { hora: "10:00", mensagem: "", dias: [] }]); }
  function removerAviso(i: number) { setAvisos(a => a.filter((_,j) => j !== i)); }
  function atualizarAviso(i: number, campo: "hora" | "mensagem", valor: string) {
    setAvisos(a => a.map((av, j) => j === i ? { ...av, [campo]: valor } : av));
  }
  function alternarDiaAviso(i: number, chave: string) {
    setAvisos(a => a.map((av, j) => {
      if (j !== i) return av;
      const dias = av.dias ?? [];
      return { ...av, dias: dias.includes(chave) ? dias.filter(d => d !== chave) : [...dias, chave] };
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome do modelo" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: 8h Diárias" />
        <Input label="Descrição (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Horas semanais" type="number" value={horasSemanais} onChange={e => setHorasSemanais(e.target.value)} />
        <Input label="Jornada diária (h)" type="number" value={jornadaDiaria} onChange={e => setJornadaDiaria(e.target.value)} />
        <Input label="Semana de plantão (h/dia)" type="number" step="0.5" value={jornadaPlantao}
          onChange={e => setJornadaPlantao(e.target.value)}
          hint="Jornada na semana que antecede o plantão. 7.5 = 7h30." />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Horas por dia (opcional)</p>
        <div className="flex flex-wrap gap-3">
          {DIAS_SEMANA.map(({ chave, label }) => (
            <div key={chave} className="flex flex-col items-center gap-1">
              <label className="text-[11px] font-medium text-slate-500">{label}</label>
              <input type="number" min="0" max="24" step="0.5"
                value={diasUteis[chave as keyof ConfiguracaoDias] ?? ""}
                onChange={e => setDiasUteis(d => ({ ...d, [chave]: e.target.value ? Number(e.target.value) : undefined }))}
                className="h-9 w-16 rounded-lg border border-slate-300 bg-white text-center text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Avisos automáticos</p>
          <Button size="sm" variant="outline" onClick={adicionarAviso}>+ Aviso</Button>
        </div>
        <div className="flex flex-col gap-2">
          {avisos.map((av, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input type="time" value={av.hora} onChange={e => atualizarAviso(i,"hora",e.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input type="text" placeholder="Mensagem do aviso" value={av.mensagem}
                  onChange={e => atualizarAviso(i,"mensagem",e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <button onClick={() => removerAviso(i)} className="px-1 text-slate-400 hover:text-danger" title="Remover aviso">×</button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Dias:</span>
                {DIAS_SEMANA.map(({ chave, label }) => {
                  const ativo = (av.dias ?? []).includes(chave);
                  return (
                    <button type="button" key={chave} onClick={() => alternarDiaAviso(i, chave)}
                      className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                        ativo ? "bg-brand-blue text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700")}>
                      {label}
                    </button>
                  );
                })}
                {(!av.dias || av.dias.length === 0) && (
                  <span className="ml-1 text-[10px] text-slate-400">todos os dias</span>
                )}
              </div>
            </div>
          ))}
          {avisos.length === 0 && <p className="text-xs text-slate-400">Nenhum aviso configurado.</p>}
        </div>
      </div>

      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="flex gap-2">
        <Button onClick={salvar} loading={salvando} disabled={!nome}>Salvar modelo</Button>
        <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>
      </div>
    </div>
  );
}

export function ModelosHorarioBoard({ modelosIniciais }: { modelosIniciais: ModeloView[] }) {
  const [modelos, setModelos] = useState(modelosIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function criarModelo(dados: unknown) {
    const res = await fetch("/api/v1/modelos-horario", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Erro ao criar.");
    setModelos(m => [{ ...json, _count: { usuarios: 0 } }, ...m]);
    setCriando(false);
  }

  async function atualizarModelo(id: string, dados: unknown) {
    const res = await fetch(`/api/v1/modelos-horario/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Erro ao atualizar.");
    setModelos(m => m.map(mo => mo.id === id ? { ...json, _count: mo._count } : mo));
    setEditandoId(null);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este modelo? Os usuários vinculados perderão o vínculo.")) return;
    const res = await fetch(`/api/v1/modelos-horario/${id}`, { method: "DELETE" });
    if (res.ok) setModelos(m => m.filter(mo => mo.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {!criando && !editandoId && (
        <Button onClick={() => setCriando(true)} className="self-start">+ Novo modelo</Button>
      )}

      {criando && (
        <Card>
          <p className="mb-4 font-semibold text-slate-900 dark:text-white">Novo modelo de horário</p>
          <FormModelo onSalvar={criarModelo} onCancelar={() => setCriando(false)} />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modelos.map(m => (
          <Card key={m.id} className={editandoId === m.id ? "col-span-full" : ""}>
            {editandoId === m.id ? (
              <>
                <p className="mb-4 font-semibold text-slate-900 dark:text-white">Editar modelo</p>
                <FormModelo inicial={m} onSalvar={d => atualizarModelo(m.id, d)} onCancelar={() => setEditandoId(null)} />
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{m.nome}</p>
                    {m.descricao && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.descricao}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditandoId(m.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button onClick={() => excluir(m.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-950/30">
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-medium text-brand-blue">{m.horasSemanais}h/semana</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{m.jornadaDiaria}h/dia</span>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">plantão: {m.jornadaPlantao ?? 7.5}h/dia</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{m._count.usuarios} usuário(s)</span>
                </div>
                {m.configuracao?.avisos && m.configuracao.avisos.length > 0 && (
                  <div className="mt-2">
                    {m.configuracao.avisos.map((av, i) => (
                      <p key={i} className="text-xs text-slate-500 dark:text-slate-400">
                        ⏰ {av.hora} — {av.mensagem}
                        <span className="text-slate-400 dark:text-slate-500"> · {rotuloDias(av.dias)}</span>
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        ))}
        {modelos.length === 0 && !criando && (
          <p className="col-span-full text-center text-sm text-slate-500 py-8">Nenhum modelo criado ainda.</p>
        )}
      </div>
    </div>
  );
}
