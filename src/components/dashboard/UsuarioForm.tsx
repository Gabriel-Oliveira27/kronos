"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ROTULOS_PAPEL } from "@/lib/utils";
import type { Papel } from "@prisma/client";

export interface UsuarioFormValues {
  nomeCompleto: string;
  setor: string;
  username: string;
  email: string;
  papel: Papel;
  temApp: boolean;
}

const VAZIO: UsuarioFormValues = {
  nomeCompleto: "",
  setor: "",
  username: "",
  email: "",
  papel: "USUARIO",
  temApp: false,
};

const PAPEIS: Papel[] = ["USUARIO", "CONFIGURADOR_ESCALA", "SUPORTE", "ADMIN"];

export function UsuarioForm({
  usuarioId,
  solicitacaoId,
  valoresIniciais,
  onSucesso,
  onCancelar,
}: {
  usuarioId?: string;
  solicitacaoId?: string;
  valoresIniciais?: Partial<UsuarioFormValues>;
  onSucesso: (usuario: unknown) => void;
  onCancelar: () => void;
}) {
  const editando = !!usuarioId;
  const [valores, setValores] = useState<UsuarioFormValues>({ ...VAZIO, ...valoresIniciais });
  const [senha, setSenha] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  async function enviarFoto(file: File) {
    setEnviandoFoto(true);
    setErro(null);
    try {
      const formData = new FormData();
      formData.append("arquivo", file);
      const res = await fetch("/api/v1/fotos/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível enviar a foto.");
        return;
      }
      setFotoUrl(data.url);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);

    const payload: Record<string, unknown> = {
      nomeCompleto: valores.nomeCompleto,
      setor: valores.setor,
      email: valores.email,
      papel: valores.papel,
      temApp: valores.temApp,
      ...(fotoUrl ? { fotoUrl } : {}),
    };

    if (!editando) {
      payload.username = valores.username;
      payload.senha = senha;
      if (solicitacaoId) payload.solicitacaoId = solicitacaoId;
    } else if (senha) {
      payload.novaSenha = senha;
    }

    try {
      const url = editando ? `/api/v1/admin/usuarios/${usuarioId}` : "/api/v1/admin/usuarios";
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível salvar.");
        return;
      }
      onSucesso(data);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome completo"
          value={valores.nomeCompleto}
          onChange={(e) => setValores({ ...valores, nomeCompleto: e.target.value })}
        />
        <Input
          label="Setor"
          value={valores.setor}
          onChange={(e) => setValores({ ...valores, setor: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Usuário (login)"
          value={valores.username}
          disabled={editando}
          onChange={(e) => setValores({ ...valores, username: e.target.value })}
          hint={editando ? "O login não pode ser alterado depois de criado." : undefined}
        />
        <Input
          label={editando ? "Nova senha (opcional)" : "Senha"}
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="E-mail (opcional)"
          type="email"
          value={valores.email}
          onChange={(e) => setValores({ ...valores, email: e.target.value })}
        />
        <Select
          label="Papel"
          value={valores.papel}
          onChange={(e) => setValores({ ...valores, papel: e.target.value as Papel })}
        >
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {ROTULOS_PAPEL[p]}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={valores.temApp}
          onChange={(e) => setValores({ ...valores, temApp: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
        />
        Usa o aplicativo mobile
      </label>

      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Foto (opcional)</p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={enviandoFoto}
            onClick={() => inputFotoRef.current?.click()}
          >
            {fotoUrl ? "Trocar foto" : "Enviar foto"}
          </Button>
          {fotoUrl && <span className="text-xs text-brand-green-dark dark:text-brand-green">Foto pronta ✓</span>}
        </div>
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) enviarFoto(file);
          }}
        />
      </div>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <div className="flex gap-2 pt-2">
        <Button
          onClick={salvar}
          loading={salvando}
          disabled={!valores.nomeCompleto || !valores.setor || (!editando && (!valores.username || !senha))}
        >
          {editando ? "Salvar alterações" : "Criar acesso"}
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
