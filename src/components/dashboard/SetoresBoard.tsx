"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { cn } from "@/lib/utils";

export interface SetorView { id: string; nome: string; temPalavra: boolean }

export function SetoresBoard({ setoresIniciais }: { setoresIniciais: SetorView[] }) {
  const [setores, setSetores] = useState(setoresIniciais);
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdit, setNomeEdit] = useState("");
  const [segredoId, setSegredoId] = useState<string | null>(null);
  const [segredo, setSegredo] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function criar() {
    if (!novoNome.trim()) return;
    setCriando(true); setErro(null);
    try {
      const res = await fetch("/api/v1/setores", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json?.error ?? "Não foi possível criar o setor."); return; }
      setSetores((prev) => [...prev, json].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNome("");
    } catch { setErro("Erro de conexão."); }
    finally { setCriando(false); }
  }

  async function renomear(id: string) {
    if (!nomeEdit.trim()) return;
    setOcupado(id); setErro(null);
    try {
      const res = await fetch(`/api/v1/setores/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeEdit.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json?.error ?? "Não foi possível renomear."); return; }
      setSetores((prev) => prev.map((s) => (s.id === id ? json : s)).sort((a, b) => a.nome.localeCompare(b.nome)));
      setEditandoId(null);
    } catch { setErro("Erro de conexão."); }
    finally { setOcupado(null); }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este setor? Só é possível se nenhum usuário estiver vinculado a ele.")) return;
    setOcupado(id); setErro(null);
    try {
      const res = await fetch(`/api/v1/setores/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { setErro(json?.error ?? "Não foi possível excluir."); return; }
      setSetores((prev) => prev.filter((s) => s.id !== id));
    } catch { setErro("Erro de conexão."); }
    finally { setOcupado(null); }
  }

  async function salvarSegredo(id: string) {
    setOcupado(id); setErro(null);
    try {
      const res = await fetch("/api/v1/setores/palavra-secreta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setorId: id, palavraSecreta: segredo.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json?.error ?? "Não foi possível salvar a palavra secreta."); return; }
      setSetores((prev) => prev.map((s) => (s.id === id ? { ...s, temPalavra: !!json.temPalavra } : s)));
      setSegredoId(null); setSegredo("");
    } catch { setErro("Erro de conexão."); }
    finally { setOcupado(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Setores</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Crie os setores para vincular aos usuários e recortar as escalas. A palavra secreta libera a visualização pública da escala daquele setor.
        </p>
      </div>

      {/* Criar setor */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Novo setor" placeholder="Ex.: Suporte, Loja 02…" value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && criar()} />
        </div>
        <Button onClick={criar} loading={criando} disabled={!novoNome.trim()}>Adicionar setor</Button>
      </Card>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      {/* Lista */}
      <Card className="p-0">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {setores.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                {editandoId === s.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} autoFocus className="h-9"
                      onKeyDown={(e) => e.key === "Enter" && renomear(s.id)} />
                    <Button size="sm" onClick={() => renomear(s.id)} loading={ocupado === s.id}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{s.nome}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        s.temPalavra ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                        {s.temPalavra ? "palavra secreta ✓" : "sem palavra"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSegredoId(segredoId === s.id ? null : s.id); setSegredo(""); }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-brand-blue dark:hover:bg-slate-800">
                        Palavra secreta
                      </button>
                      <button onClick={() => { setEditandoId(s.id); setNomeEdit(s.nome); }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-brand-blue dark:hover:bg-slate-800">
                        Renomear
                      </button>
                      <button onClick={() => excluir(s.id)} disabled={ocupado === s.id}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-danger dark:hover:bg-red-950/30">
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>

              {segredoId === s.id && (
                <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <PasswordInput label="Palavra secreta da escala pública"
                      placeholder={s.temPalavra ? "Deixe vazio para remover" : "Defina uma palavra"}
                      value={segredo} onChange={(e) => setSegredo(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={() => salvarSegredo(s.id)} loading={ocupado === s.id}>Salvar</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {setores.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum setor criado ainda.</p>
        )}
      </Card>
    </div>
  );
}
