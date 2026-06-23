"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
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
  modeloHorarioId: string;
}

export interface UsuarioFormHandle {
  salvar: () => Promise<boolean>;
}

interface ModeloHorarioOpcao { id: string; nome: string }

const VAZIO: UsuarioFormValues = {
  nomeCompleto: "",
  setor: "",
  username: "",
  email: "",
  papel: "USUARIO",
  temApp: false,
  modeloHorarioId: "",
};

const PAPEIS: Papel[] = ["USUARIO", "CONFIGURADOR_ESCALA", "SUPORTE", "ADMIN"];

interface UsuarioFormProps {
  usuarioId?: string;
  solicitacaoId?: string;
  valoresIniciais?: Partial<UsuarioFormValues>;
  onSucesso: (usuario: unknown) => void;
  onCancelar: () => void;
  onDirtyChange?: (sujo: boolean) => void;
}

export const UsuarioForm = forwardRef<UsuarioFormHandle, UsuarioFormProps>(function UsuarioForm(
  { usuarioId, solicitacaoId, valoresIniciais, onSucesso, onCancelar, onDirtyChange },
  ref
) {
  const editando = !!usuarioId;
  const [valores, setValores] = useState<UsuarioFormValues>({ ...VAZIO, ...valoresIniciais });
  const [senha, setSenha] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modelos, setModelos] = useState<ModeloHorarioOpcao[]>([]);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  // Snapshot dos valores iniciais para detectar alterações não salvas.
  const snapshotInicial = useRef(JSON.stringify({ ...VAZIO, ...valoresIniciais }));

  useEffect(() => {
    let ativo = true;
    fetch("/api/v1/modelos-horario")
      .then((res) => (res.ok ? res.json() : []))
      .then((dados) => {
        if (ativo && Array.isArray(dados)) {
          setModelos(dados.map((m: { id: string; nome: string }) => ({ id: m.id, nome: m.nome })));
        }
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  // Reporta ao pai se há alterações pendentes (para confirmar antes de trocar de usuário).
  useEffect(() => {
    const sujo = JSON.stringify(valores) !== snapshotInicial.current || senha !== "" || fotoUrl !== "";
    onDirtyChange?.(sujo);
  }, [valores, senha, fotoUrl, onDirtyChange]);

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

  async function salvar(): Promise<boolean> {
    setSalvando(true);
    setErro(null);

    const payload: Record<string, unknown> = {
      nomeCompleto: valores.nomeCompleto,
      setor: valores.setor,
      email: valores.email,
      papel: valores.papel,
      temApp: valores.temApp,
      modeloHorarioId: valores.modeloHorarioId,
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
        return false;
      }
      onSucesso(data);
      return true;
    } catch {
      setErro("Não foi possível conectar ao servidor.");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  useImperativeHandle(ref, () => ({ salvar }));

  const podeSalvar =
    !!valores.nomeCompleto && !!valores.setor && (editando || (!!valores.username && !!senha));

  const iniciais = valores.nomeCompleto
    .split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho do painel */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-semibold text-brand-blue">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              iniciais
            )}
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {editando ? valores.nomeCompleto || "Editar usuário" : "Novo acesso"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editando ? "Atualize os dados do colaborador." : "Preencha os dados para criar um acesso."}
            </p>
          </div>
        </div>
      </div>

      {/* Identificação */}
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

      {/* Credenciais */}
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

      {/* Contato e papel */}
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

      {/* Jornada e app */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Modelo de horário"
          value={valores.modeloHorarioId}
          onChange={(e) => setValores({ ...valores, modeloHorarioId: e.target.value })}
        >
          <option value="">Nenhum</option>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </Select>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Aplicativo mobile</span>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={valores.temApp}
              onChange={(e) => setValores({ ...valores, temApp: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            Usa o aplicativo mobile
          </label>
        </div>
      </div>

      {/* Foto */}
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

      <div className="flex gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button onClick={salvar} loading={salvando} disabled={!podeSalvar}>
          {editando ? "Salvar alterações" : "Criar acesso"}
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
});
