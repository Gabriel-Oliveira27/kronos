"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SeletorChip, type OpcaoChip } from "@/components/ui/SeletorChip";
import { OPCOES_ACESSO } from "@/lib/utils";
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

const VAZIO: UsuarioFormValues = {
  nomeCompleto: "",
  setor: "",
  username: "",
  email: "",
  papel: "USUARIO",
  temApp: false,
  modeloHorarioId: "",
};

interface UsuarioFormProps {
  usuarioId?: string;
  solicitacaoId?: string;
  valoresIniciais?: Partial<UsuarioFormValues>;
  fotoUrlInicial?: string | null;
  onSucesso: (usuario: unknown) => void;
  onCancelar: () => void;
  onDirtyChange?: (sujo: boolean) => void;
}

export const UsuarioForm = forwardRef<UsuarioFormHandle, UsuarioFormProps>(function UsuarioForm(
  { usuarioId, solicitacaoId, valoresIniciais, fotoUrlInicial, onSucesso, onCancelar, onDirtyChange },
  ref
) {
  const editando = !!usuarioId;
  const [valores, setValores] = useState<UsuarioFormValues>({ ...VAZIO, ...valoresIniciais });
  const [senha, setSenha] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modelos, setModelos] = useState<OpcaoChip[]>([]);
  const [setores, setSetores] = useState<OpcaoChip[]>([]);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const snapshotInicial = useRef(JSON.stringify({ ...VAZIO, ...valoresIniciais }));

  // Carrega modelos de horário e setores para os seletores.
  useEffect(() => {
    let ativo = true;
    Promise.all([
      fetch("/api/v1/modelos-horario").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/setores").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([mods, sets]) => {
        if (!ativo) return;
        if (Array.isArray(mods)) setModelos(mods.map((m: { id: string; nome: string }) => ({ value: m.id, label: m.nome })));
        if (Array.isArray(sets)) setSetores(sets.map((s: { nome: string }) => ({ value: s.nome, label: s.nome })));
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

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

  const fotoAtual = fotoUrl || fotoUrlInicial || "";
  const iniciais = valores.nomeCompleto
    .split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho do painel: foto (com lápis no hover) + título */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => inputFotoRef.current?.click()}
          title="Enviar/trocar foto"
          className="group relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-blue/10 text-lg font-semibold text-brand-blue"
        >
          {fotoAtual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoAtual} alt="" className="h-16 w-16 object-cover" />
          ) : (
            iniciais
          )}
          {/* Overlay com lápis ao passar o mouse */}
          <span className="absolute inset-0 grid place-items-center bg-slate-900/50 opacity-0 transition-opacity group-hover:opacity-100">
            {enviandoFoto ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {editando ? valores.nomeCompleto || "Editar usuário" : "Novo acesso"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {editando ? "Atualize os dados do colaborador." : "Preencha os dados para criar um acesso."}
          </p>
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

      {/* Linha 1: Nome | Setor | E-mail */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Nome completo"
          value={valores.nomeCompleto}
          onChange={(e) => setValores({ ...valores, nomeCompleto: e.target.value })}
        />
        <SeletorChip
          label="Setor"
          value={valores.setor}
          onChange={(v) => setValores({ ...valores, setor: v })}
          opcoes={setores}
          permitirCriar
          placeholder="Buscar ou criar setor…"
        />
        <Input
          label="E-mail (opcional)"
          type="email"
          value={valores.email}
          onChange={(e) => setValores({ ...valores, email: e.target.value })}
          hint="Também pode ser usado para login."
        />
      </div>

      {/* Linha 2: Usuário | Senha | Acesso */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Usuário (login)"
          value={valores.username}
          disabled={editando}
          onChange={(e) => setValores({ ...valores, username: e.target.value })}
          hint={editando ? "O login não pode ser alterado." : undefined}
        />
        <Input
          label={editando ? "Nova senha (opcional)" : "Senha"}
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <SeletorChip
          label="Acesso"
          value={valores.papel}
          onChange={(v) => setValores({ ...valores, papel: (v || "USUARIO") as Papel })}
          opcoes={OPCOES_ACESSO}
          placeholder="Selecionar acesso…"
          chipClassName="bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/30"
        />
      </div>

      {/* Linha 3: Modelo de horário | Usa aplicativo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SeletorChip
          label="Modelo de horário"
          value={valores.modeloHorarioId}
          onChange={(v) => setValores({ ...valores, modeloHorarioId: v })}
          opcoes={modelos}
          placeholder="Buscar modelo…"
          chipClassName="bg-brand-green/10 text-brand-green-dark dark:text-brand-green ring-1 ring-brand-green/30"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Usa aplicativo</span>
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={valores.temApp}
              onChange={(e) => setValores({ ...valores, temApp: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            {valores.temApp ? "Sim, usa o app" : "Não usa o app"}
          </label>
        </div>
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
