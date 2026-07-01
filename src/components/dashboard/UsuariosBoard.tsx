"use client";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UsuarioForm, type UsuarioFormHandle } from "@/components/dashboard/UsuarioForm";
import { ROTULOS_ACESSO, formatarData, cn } from "@/lib/utils";

export interface UsuarioView {
  id: string; nomeCompleto: string; setor: string; email: string | null;
  username: string; papel: string; temApp: boolean; ativo: boolean; ehGhost?: boolean;
  fotoUrl: string | null; modeloHorarioId: string | null; criadoEm: string;
}

function Avatar({ usuario, size = 32 }: { usuario: UsuarioView; size?: number }) {
  const cores = ["bg-blue-500","bg-green-500","bg-purple-500","bg-amber-500","bg-red-500","bg-teal-500"];
  const cor = cores[usuario.nomeCompleto.charCodeAt(0) % cores.length];
  const iniciais = usuario.nomeCompleto.split(" ").filter(Boolean).slice(0,2).map(p=>p[0]).join("").toUpperCase();
  if (usuario.fotoUrl) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={usuario.fotoUrl} alt={usuario.nomeCompleto}
      className="shrink-0 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
      style={{width:size,height:size}} />
  );
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", cor)}
      style={{width:size,height:size,fontSize:size*0.38}}>{iniciais}</span>
  );
}

export function UsuariosBoard({
  usuariosIniciais, podeEditar, descricao,
}: { usuariosIniciais: UsuarioView[]; podeEditar: boolean; descricao: string }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [painel, setPainel] = useState<"nenhum" | "criar" | string>("nenhum");
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [salvandoAtivo, setSalvandoAtivo] = useState<string | null>(null);
  const [formSujo, setFormSujo] = useState(false);
  const [pendente, setPendente] = useState<"nenhum" | "criar" | string | null>(null);
  const [salvandoTroca, setSalvandoTroca] = useState(false);
  const formRef = useRef<UsuarioFormHandle>(null);

  function solicitarPainel(destino: "nenhum" | "criar" | string) {
    if (painel !== "nenhum" && painel !== destino && formSujo) {
      setPendente(destino);
      return;
    }
    setFormSujo(false);
    setPainel(destino);
  }

  function descartarEContinuar() {
    if (pendente === null) return;
    setFormSujo(false);
    setPainel(pendente);
    setPendente(null);
  }

  async function salvarEContinuar() {
    if (pendente === null) return;
    setSalvandoTroca(true);
    const ok = await formRef.current?.salvar();
    setSalvandoTroca(false);
    if (ok) {
      setFormSujo(false);
      setPainel(pendente);
      setPendente(null);
    }
  }

  function aoSalvar(dados: unknown) {
    const u = dados as UsuarioView;
    setUsuarios(prev => {
      const existe = prev.some(x => x.id === u.id);
      if (existe) return prev.map(x => x.id === u.id ? { ...x, ...u } : x);
      return [u, ...prev];
    });
    setFormSujo(false);
    setPainel("nenhum");
  }

  async function toggleAtivo(u: UsuarioView) {
    setSalvandoAtivo(u.id);
    try {
      const res = await fetch(`/api/v1/admin/usuarios/${u.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !u.ativo }),
      });
      if (res.ok) {
        const json = await res.json();
        setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, ativo: json.ativo } : x));
      }
    } finally { setSalvandoAtivo(null); }
  }

  const editando = usuarios.find(u => u.id === painel);
  const emEdicao = painel !== "nenhum" && podeEditar && (painel === "criar" || !!editando);

  const filtrados = usuarios.filter(u =>
    filtroAtivo === "todos" ? true : filtroAtivo === "ativos" ? u.ativo : !u.ativo
  );

  const BADGE_ACESSO: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    SUPORTE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    CONFIGURADOR_ESCALA: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    USUARIO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  const dialogo = pendente !== null && (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="animate-overlay absolute inset-0 bg-slate-900/50" onClick={() => setPendente(null)} />
      <div className="animate-modal relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Alterações não salvas</h3>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Você tem alterações não salvas neste usuário. O que deseja fazer antes de continuar?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={salvarEContinuar} loading={salvandoTroca}>Salvar e continuar</Button>
          <Button variant="outline" onClick={descartarEContinuar} disabled={salvandoTroca}>Descartar alterações</Button>
          <Button variant="ghost" onClick={() => setPendente(null)} disabled={salvandoTroca}>Cancelar</Button>
        </div>
      </div>
    </div>
  );

  // ── Modo edição/criação: ocupa toda a área (sem explicação, listagem ou botão) ──
  if (emEdicao) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => solicitarPainel("nenhum")}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-blue dark:text-slate-400"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Voltar para a lista
        </button>
        <Card className="animate-painel">
          {painel === "criar" ? (
            <UsuarioForm key="criar" ref={formRef} onSucesso={aoSalvar} onCancelar={() => solicitarPainel("nenhum")} onDirtyChange={setFormSujo} />
          ) : (
            <UsuarioForm
              key={editando!.id}
              ref={formRef}
              usuarioId={editando!.id}
              fotoUrlInicial={editando!.fotoUrl}
              valoresIniciais={{ nomeCompleto: editando!.nomeCompleto, setor: editando!.setor,
                username: editando!.username, email: editando!.email ?? "", papel: editando!.papel as never,
                temApp: editando!.temApp, modeloHorarioId: editando!.modeloHorarioId ?? "" }}
              onSucesso={aoSalvar}
              onCancelar={() => solicitarPainel("nenhum")}
              onDirtyChange={setFormSujo}
            />
          )}
        </Card>
        {dialogo}
      </div>
    );
  }

  // ── Modo lista ──
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Usuários</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{descricao}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {(["ativos","inativos","todos"] as const).map(f => (
              <button key={f} onClick={() => setFiltroAtivo(f)}
                className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  filtroAtivo === f ? "bg-brand-blue text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                {f}
              </button>
            ))}
          </div>
          {podeEditar && (
            <Button size="sm" onClick={() => solicitarPainel("criar")}>
              <svg viewBox="0 0 24 24" fill="none" className="mr-1.5 h-4 w-4">
                <path d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Criar acesso
            </Button>
          )}
        </div>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Setor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Acesso</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">App</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Desde</th>
                {podeEditar && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id} className={cn("border-b border-slate-100 last:border-0 dark:border-slate-800/60 transition-colors",
                  !u.ativo && "opacity-50")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar usuario={u} size={36} />
                      <div>
                        <p className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
                          {u.nomeCompleto}
                          {u.ehGhost && (
                            <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">escala</span>
                          )}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{u.setor}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BADGE_ACESSO[u.papel] ?? BADGE_ACESSO.USUARIO)}>
                      {ROTULOS_ACESSO[u.papel] ?? u.papel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium",
                      u.temApp ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                      {u.temApp ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="tabular px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatarData(u.criadoEm)}</td>
                  {podeEditar && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => solicitarPainel(u.id)} title="Editar"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-blue dark:hover:bg-slate-800 transition-colors">
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                            <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button onClick={() => toggleAtivo(u)} disabled={salvandoAtivo === u.id}
                          title={u.ativo ? "Desativar usuário" : "Reativar usuário"}
                          className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                            u.ativo ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                              : "text-slate-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30")}>
                          {salvandoAtivo === u.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : u.ativo ? (
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                              <path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                              <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum usuário nesta categoria.</p>
          )}
        </Card>
      </div>

      {dialogo}
    </div>
  );
}
