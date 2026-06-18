"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, BadgePapel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UsuarioForm } from "@/components/dashboard/UsuarioForm";
import { ROTULOS_PAPEL, formatarData } from "@/lib/utils";

export interface UsuarioView {
  id: string;
  nomeCompleto: string;
  setor: string;
  email: string | null;
  username: string;
  papel: string;
  temApp: boolean;
  criadoEm: string;
}

export function UsuariosBoard({
  usuariosIniciais,
  podeEditar,
}: {
  usuariosIniciais: UsuarioView[];
  podeEditar: boolean;
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [painel, setPainel] = useState<"nenhum" | "criar" | string>("nenhum");

  function aoSalvar(dados: unknown) {
    const usuario = dados as UsuarioView;
    setUsuarios((prev) => {
      const existe = prev.some((u) => u.id === usuario.id);
      if (existe) return prev.map((u) => (u.id === usuario.id ? { ...u, ...usuario } : u));
      return [usuario, ...prev];
    });
    setPainel("nenhum");
  }

  const editando = usuarios.find((u) => u.id === painel);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{usuarios.length} usuário(s)</p>
        {podeEditar && (
          <Button size="sm" onClick={() => setPainel("criar")}>
            Criar acesso
          </Button>
        )}
      </div>

      {podeEditar && painel === "criar" && (
        <Card>
          <UsuarioForm onSucesso={aoSalvar} onCancelar={() => setPainel("nenhum")} />
        </Card>
      )}

      {podeEditar && editando && (
        <Card>
          <UsuarioForm
            usuarioId={editando.id}
            valoresIniciais={{
              nomeCompleto: editando.nomeCompleto,
              setor: editando.setor,
              username: editando.username,
              email: editando.email ?? "",
              papel: editando.papel as never,
              temApp: editando.temApp,
            }}
            onSucesso={aoSalvar}
            onCancelar={() => setPainel("nenhum")}
          />
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              {podeEditar && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{u.nomeCompleto}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{u.username}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.setor}</td>
                <td className="px-4 py-3">
                  <BadgePapel papel={u.papel} rotulo={ROTULOS_PAPEL[u.papel]} />
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.temApp ? "green" : "slate"}>{u.temApp ? "Sim" : "Não"}</Badge>
                </td>
                <td className="tabular px-4 py-3 text-slate-500 dark:text-slate-400">
                  {formatarData(u.criadoEm)}
                </td>
                {podeEditar && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setPainel(u.id)}
                      className="text-xs font-medium text-brand-blue hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum usuário cadastrado ainda.
          </p>
        )}
      </Card>
    </div>
  );
}
