"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea, Select } from "@/components/ui/Field";
import { formatarDataHora, cn } from "@/lib/utils";

export interface ConhecimentoItemView {
  id: string; titulo: string; conteudo: string; categoria: string | null;
  tags: string[]; visibilidade: "PUBLICO" | "PRIVADO"; autorId: string;
  atualizadoEm: string; autor: { id: string; nomeCompleto: string };
}

interface FormState {
  titulo: string; conteudo: string; categoria: string;
  tags: string; visibilidade: "PUBLICO" | "PRIVADO";
}

const VAZIO: FormState = { titulo: "", conteudo: "", categoria: "", tags: "", visibilidade: "PRIVADO" };

const IcoGlobo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
    <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 0 1 3 12c0-1.295.27-2.528.757-3.643"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoCadeado = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
    <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoLapis = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoLixeira = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ConhecimentoBoard({
  itensIniciais, usuarioId, isAdmin,
}: {
  itensIniciais: ConhecimentoItemView[];
  usuarioId: string;
  isAdmin: boolean;
}) {
  const [itens, setItens] = useState(itensIniciais);
  const [form, setForm] = useState<FormState>(VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrando, setMostrando] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  function iniciarEdicao(item: ConhecimentoItemView) {
    setEditandoId(item.id);
    setForm({ titulo: item.titulo, conteudo: item.conteudo,
      categoria: item.categoria ?? "", tags: item.tags.join(", "),
      visibilidade: item.visibilidade });
    setErro(null);
  }

  function cancelar() { setEditandoId(null); setCriando(false); setForm(VAZIO); setErro(null); }

  async function salvar() {
    setSalvando(true); setErro(null);
    const payload = {
      titulo: form.titulo.trim(), conteudo: form.conteudo.trim(),
      categoria: form.categoria.trim() || null,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      visibilidade: form.visibilidade,
    };
    try {
      const url = editandoId ? `/api/v1/conhecimento/${editandoId}` : "/api/v1/conhecimento";
      const res = await fetch(url, { method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) { setErro(json?.error ?? "Não foi possível salvar."); return; }
      if (editandoId) setItens(prev => prev.map(i => i.id === editandoId ? json : i));
      else setItens(prev => [json, ...prev]);
      cancelar();
    } catch { setErro("Erro de conexão."); }
    finally { setSalvando(false); }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este item?")) return;
    try {
      const res = await fetch(`/api/v1/conhecimento/${id}`, { method: "DELETE" });
      if (res.ok) setItens(prev => prev.filter(i => i.id !== id));
    } catch { /* silencioso */ }
  }

  const itensFiltrados = itens.filter(i =>
    i.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    i.conteudo.toLowerCase().includes(busca.toLowerCase())
  );

  const podeEditar = (item: ConhecimentoItemView) => item.autorId === usuarioId || isAdmin;

  return (
    <div className="flex flex-col gap-4">
      {/* Orientação antes de criar */}
      {!criando && !editandoId && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">💡 Como usar esta área</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Armazene procedimentos, links importantes, processos pouco frequentes e informações úteis
            para consulta futura. Exemplos: acessos de e-mail, procedimentos fiscais, verificações técnicas
            e documentações internas.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar…" value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />
        <Button onClick={() => { setCriando(true); setEditandoId(null); setForm(VAZIO); }}>
          + Novo item
        </Button>
      </div>

      {/* Formulário criar/editar */}
      {(criando || editandoId) && (
        <Card>
          <p className="mb-4 font-semibold text-slate-900 dark:text-white">
            {editandoId ? "Editar item" : "Novo item de conhecimento"}
          </p>
          <div className="flex flex-col gap-4">
            <Input label="Título" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            <Textarea label="Conteúdo" rows={5} value={form.conteudo}
              onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Categoria (opcional)" value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
              <Input label="Tags (separadas por vírgula)" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <Select label="Visibilidade" value={form.visibilidade}
              onChange={e => setForm(f => ({ ...f, visibilidade: e.target.value as "PUBLICO" | "PRIVADO" }))}>
              <option value="PRIVADO">🔒 Privado — só eu vejo</option>
              <option value="PUBLICO">🌐 Público — todos os usuários</option>
            </Select>
            {/* Aviso ao escolher público */}
            {form.visibilidade === "PUBLICO" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                ⚠️ Todos os usuários terão acesso a este conteúdo. Não publique informações sensíveis ou desnecessárias.
              </div>
            )}
            {erro && <p className="text-sm text-danger">{erro}</p>}
            <div className="flex gap-2">
              <Button onClick={salvar} loading={salvando} disabled={!form.titulo || !form.conteudo}>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 mr-1.5">
                  <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Salvar
              </Button>
              <Button variant="ghost" onClick={cancelar}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de itens */}
      <div className="flex flex-col gap-3">
        {itensFiltrados.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {busca ? "Nenhum resultado encontrado." : "Nenhum item ainda. Crie o primeiro!"}
          </p>
        )}
        {itensFiltrados.map(item => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => setMostrando(m => m === item.id ? null : item.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span title={item.visibilidade === "PUBLICO" ? "Público" : "Privado"}
                    className={item.visibilidade === "PUBLICO" ? "text-brand-blue" : "text-slate-400"}>
                    {item.visibilidade === "PUBLICO" ? <IcoGlobo /> : <IcoCadeado />}
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.titulo}</p>
                  {item.categoria && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {item.categoria}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.autor.nomeCompleto} · {formatarDataHora(item.atualizadoEm)}
                </p>
              </button>

              {podeEditar(item) && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => iniciarEdicao(item)} title="Editar"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                    <IcoLapis />
                  </button>
                  <button onClick={() => excluir(item.id)} title="Excluir"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-950/30">
                    <IcoLixeira />
                  </button>
                </div>
              )}
            </div>

            {mostrando === item.id && (
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{item.conteudo}</p>
                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[11px] font-medium text-brand-blue">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
