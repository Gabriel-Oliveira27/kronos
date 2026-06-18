"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea, Select } from "@/components/ui/Field";
import { formatarDataHora } from "@/lib/utils";

export interface ConhecimentoItemView {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string | null;
  tags: string[];
  visibilidade: "PUBLICO" | "PRIVADO";
  autorId: string;
  atualizadoEm: string;
  autor: { id: string; nomeCompleto: string };
}

interface FormState {
  titulo: string;
  conteudo: string;
  categoria: string;
  tags: string;
  visibilidade: "PUBLICO" | "PRIVADO";
}

const FORM_VAZIO: FormState = { titulo: "", conteudo: "", categoria: "", tags: "", visibilidade: "PRIVADO" };

export function ConhecimentoBoard({
  itensIniciais,
  usuarioId,
  vePrivadosDeOutros,
}: {
  itensIniciais: ConhecimentoItemView[];
  usuarioId: string;
  vePrivadosDeOutros: boolean;
}) {
  const [itens, setItens] = useState(itensIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function abrirCriacao() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
    setErro(null);
    setCriando(true);
  }

  function abrirEdicao(item: ConhecimentoItemView) {
    setForm({
      titulo: item.titulo,
      conteudo: item.conteudo,
      categoria: item.categoria ?? "",
      tags: item.tags.join(", "),
      visibilidade: item.visibilidade,
    });
    setEditandoId(item.id);
    setErro(null);
    setCriando(true);
  }

  function fechar() {
    setCriando(false);
    setEditandoId(null);
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const payload = {
      titulo: form.titulo,
      conteudo: form.conteudo,
      categoria: form.categoria,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      visibilidade: form.visibilidade,
    };

    try {
      const url = editandoId ? `/api/v1/conhecimento/${editandoId}` : "/api/v1/conhecimento";
      const res = await fetch(url, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível salvar.");
        return;
      }

      if (editandoId) {
        setItens((prev) => prev.map((i) => (i.id === editandoId ? { ...i, ...data } : i)));
      } else {
        setItens((prev) => [data, ...prev]);
      }
      fechar();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este item? Ele poderá ser recuperado pelo app por até 24h.")) return;
    const res = await fetch(`/api/v1/conhecimento/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItens((prev) => prev.filter((i) => i.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {itens.length} {itens.length === 1 ? "item" : "itens"} visível(is) para você
        </p>
        <Button size="sm" onClick={abrirCriacao}>
          Novo item
        </Button>
      </div>

      {criando && (
        <Card>
          <div className="flex flex-col gap-4">
            <Input
              label="Título"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              autoFocus
            />
            <Textarea
              label="Conteúdo"
              rows={5}
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Categoria (opcional)"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
              <Input
                label="Tags (separadas por vírgula)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <Select
              label="Visibilidade"
              value={form.visibilidade}
              onChange={(e) => setForm({ ...form, visibilidade: e.target.value as "PUBLICO" | "PRIVADO" })}
            >
              <option value="PRIVADO">Privado (só eu e administradores)</option>
              <option value="PUBLICO">Público (toda a equipe)</option>
            </Select>
            {erro && <p className="text-sm text-danger">{erro}</p>}
            <div className="flex gap-2">
              <Button onClick={salvar} loading={salvando} disabled={!form.titulo || !form.conteudo}>
                Salvar
              </Button>
              <Button variant="ghost" onClick={fechar}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((item) => {
          const proprio = item.autorId === usuarioId;
          return (
            <Card key={item.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  {item.titulo}
                </h3>
                <Badge tone={item.visibilidade === "PUBLICO" ? "green" : "slate"}>
                  {item.visibilidade === "PUBLICO" ? "Público" : "Privado"}
                </Badge>
              </div>
              <p className="line-clamp-4 text-sm text-slate-600 dark:text-slate-400">{item.conteudo}</p>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge key={tag} tone="blue">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mt-auto flex items-center justify-between pt-2 text-xs text-slate-400 dark:text-slate-500">
                <span>
                  {vePrivadosDeOutros && !proprio ? `${item.autor.nomeCompleto} · ` : ""}
                  {formatarDataHora(item.atualizadoEm)}
                </span>
                {proprio && (
                  <span className="flex gap-2">
                    <button onClick={() => abrirEdicao(item)} className="font-medium text-brand-blue hover:underline">
                      Editar
                    </button>
                    <button onClick={() => excluir(item.id)} className="font-medium text-danger hover:underline">
                      Excluir
                    </button>
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {itens.length === 0 && (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum item por aqui ainda. Crie o primeiro.
        </Card>
      )}
    </div>
  );
}
