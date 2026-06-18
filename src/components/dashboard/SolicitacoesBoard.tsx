"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UsuarioForm } from "@/components/dashboard/UsuarioForm";
import { formatarDataHora } from "@/lib/utils";

export interface SolicitacaoView {
  id: string;
  nomeCompleto: string;
  setor: string;
  email: string | null;
  observacoes: string | null;
  status: string;
  criadoEm: string;
}

const TOM_STATUS: Record<string, "amber" | "green" | "red"> = {
  pendente: "amber",
  aprovada: "green",
  rejeitada: "red",
};

export function SolicitacoesBoard({ solicitacoesIniciais }: { solicitacoesIniciais: SolicitacaoView[] }) {
  const [solicitacoes, setSolicitacoes] = useState(solicitacoesIniciais);
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  async function rejeitar(id: string) {
    if (!confirm("Rejeitar esta solicitação?")) return;
    setProcessando(id);
    try {
      const res = await fetch(`/api/v1/admin/solicitacoes-acesso/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejeitada" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSolicitacoes((prev) => prev.map((s) => (s.id === id ? data : s)));
      }
    } finally {
      setProcessando(null);
    }
  }

  function aoCriarAcesso(id: string) {
    setSolicitacoes((prev) => prev.map((s) => (s.id === id ? { ...s, status: "aprovada" } : s)));
    setAprovando(null);
  }

  const pendentes = solicitacoes.filter((s) => s.status === "pendente");
  const resolvidas = solicitacoes.filter((s) => s.status !== "pendente");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Pendentes ({pendentes.length})
        </h2>
        {pendentes.length === 0 && (
          <Card className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma solicitação pendente.
          </Card>
        )}
        {pendentes.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{s.nomeCompleto}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {s.setor}
                  {s.email ? ` · ${s.email}` : ""}
                </p>
                {s.observacoes && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">“{s.observacoes}”</p>
                )}
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Enviada em {formatarDataHora(s.criadoEm)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setAprovando(s.id)}>
                  Criar acesso
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejeitar(s.id)}
                  loading={processando === s.id}
                >
                  Rejeitar
                </Button>
              </div>
            </div>

            {aprovando === s.id && (
              <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
                <UsuarioForm
                  solicitacaoId={s.id}
                  valoresIniciais={{ nomeCompleto: s.nomeCompleto, setor: s.setor, email: s.email ?? "" }}
                  onSucesso={() => aoCriarAcesso(s.id)}
                  onCancelar={() => setAprovando(null)}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {resolvidas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Histórico
          </h2>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Setor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {resolvidas.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.nomeCompleto}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.setor}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TOM_STATUS[s.status] ?? "slate"}>{s.status}</Badge>
                    </td>
                    <td className="tabular px-4 py-3 text-slate-500 dark:text-slate-400">
                      {formatarDataHora(s.criadoEm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
