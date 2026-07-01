"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { cn, horarioDoTipo, siglaTipoEscala, ehSabado } from "@/lib/utils";
import { EscalaFimDeSemana, montarLinhasFds } from "@/components/dashboard/EscalaFimDeSemana";

export interface UsuarioResumo {
  id: string;
  nomeCompleto: string;
  setor: string;
  temApp: boolean;
  fotoUrl: string | null;
}

export interface EscalaView {
  id: string;
  usuarioId: string;
  data: string;
  tipo: string;
  observacao: string | null;
}

const TIPOS = [
  { valor: "NORMAL",          sigla: "NOR", label: "Normal",        cor: "bg-slate-400 dark:bg-slate-600" },
  { valor: "PLANTAO",         sigla: "PLT", label: "Plantão",       cor: "bg-brand-blue" },
  { valor: "HOME_OFFICE",     sigla: "HO",  label: "Home office",   cor: "bg-brand-green" },
  { valor: "FOLGA",           sigla: "FOL", label: "Folga",         cor: "bg-amber-400" },
] as const;

const RING_TIPO: Record<string, string> = {
  NORMAL:          "ring-slate-400",
  PLANTAO:         "ring-blue-500",
  HOME_OFFICE:     "ring-green-500",
  FOLGA:           "ring-amber-400",
};

const COR_ATIVO: Record<string, string> = {
  NORMAL:          "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  PLANTAO:         "bg-blue-500 text-white",
  HOME_OFFICE:     "bg-green-500 text-white",
  FOLGA:           "bg-amber-400 text-amber-950",
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function iniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function Avatar({ usuario, tipo, size = 20 }: { usuario: UsuarioResumo; tipo: string; size?: number }) {
  const ring = RING_TIPO[tipo] ?? "ring-slate-400";
  const cls = `inline-flex shrink-0 items-center justify-center rounded-full ring-2 ${ring} overflow-hidden`;

  if (usuario.fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={usuario.fotoUrl} alt={usuario.nomeCompleto} title={`${usuario.nomeCompleto} · ${tipo}`}
        width={size} height={size} className={cls} style={{ width: size, height: size }} />
    );
  }
  const cores = ["bg-blue-500","bg-green-500","bg-purple-500","bg-amber-500","bg-red-500","bg-teal-500","bg-pink-500","bg-indigo-500"];
  const corIdx = usuario.nomeCompleto.charCodeAt(0) % cores.length;
  return (
    <span title={`${usuario.nomeCompleto} · ${tipo}`} className={`${cls} ${cores[corIdx]} text-white font-semibold`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {iniciais(usuario.nomeCompleto)}
    </span>
  );
}

export function EscalasBoard({
  usuarios: usuariosIniciais,
  escalasIniciais,
  diasDoMes,
  mesAtivo,
  ehAdmin,
  setorConfigurador,
  setorTemPalavra,
}: {
  usuarios: UsuarioResumo[];
  escalasIniciais: EscalaView[];
  diasDoMes: string[];
  mesAtivo?: string;
  ehAdmin: boolean;
  setorConfigurador: string | null;
  setorTemPalavra: boolean;
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  // Escala vinda do banco (base) + rascunho local (diferenças não salvas).
  const [escalasBase, setEscalasBase] = useState(escalasIniciais);
  const [rascunho, setRascunho] = useState<Record<string, string | null>>({});
  const [carregouRascunho, setCarregouRascunho] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const chaveRascunho = `kronos_escala_rascunho_${mesAtivo ?? "mes"}`;

  // Carrega rascunho salvo (efeito p/ evitar mismatch de hidratação).
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chaveRascunho);
      if (salvo) setRascunho(JSON.parse(salvo));
    } catch { /* ignora */ }
    setCarregouRascunho(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste o rascunho a cada alteração.
  useEffect(() => {
    if (!carregouRascunho) return;
    try {
      if (Object.keys(rascunho).length === 0) localStorage.removeItem(chaveRascunho);
      else localStorage.setItem(chaveRascunho, JSON.stringify(rascunho));
    } catch { /* ignora */ }
  }, [rascunho, carregouRascunho, chaveRascunho]);

  // Formulário de membro avulso
  const [mostrarAvulso, setMostrarAvulso] = useState(false);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [setorAvulso, setSetorAvulso] = useState(setorConfigurador ?? "Geral");
  const [adicionando, setAdicionando] = useState(false);
  const [erroAvulso, setErroAvulso] = useState<string | null>(null);

  // Palavra secreta do setor (só configurador — admin gerencia em Setores)
  const [mostrarSegredo, setMostrarSegredo] = useState(false);
  const [segredo, setSegredo] = useState("");
  const [salvandoSegredo, setSalvandoSegredo] = useState(false);
  const [temPalavra, setTemPalavra] = useState(setorTemPalavra);
  const [msgSegredo, setMsgSegredo] = useState<string | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);
  const [menuExport, setMenuExport] = useState(false);
  const [exportando, setExportando] = useState<string | null>(null);
  const [aba, setAba] = useState<"calendario" | "fds">("calendario");

  // Mapa efetivo: base + rascunho (null remove; valor sobrescreve/adiciona).
  const mapa = useMemo(() => {
    const m = new Map<string, EscalaView>();
    for (const e of escalasBase) m.set(`${e.usuarioId}_${e.data.slice(0, 10)}`, e);
    for (const [chave, tipo] of Object.entries(rascunho)) {
      if (tipo === null) { m.delete(chave); continue; }
      const [usuarioId, data] = chave.split("_");
      const existente = m.get(chave);
      m.set(chave, existente ? { ...existente, tipo } : { id: `draft-${chave}`, usuarioId, data, tipo, observacao: null });
    }
    return m;
  }, [escalasBase, rascunho]);

  const escalasEfetivas = useMemo(() => Array.from(mapa.values()), [mapa]);
  const qtdAlteracoes = Object.keys(rascunho).length;

  const offsetInicio = useMemo(() => {
    if (!diasDoMes.length) return 0;
    return new Date(diasDoMes[0] + "T12:00:00Z").getUTCDay();
  }, [diasDoMes]);

  const hoje = new Date().toISOString().slice(0, 10);

  // ───── Ações de escala (apenas rascunho local) ─────

  function definirTipo(usuarioId: string, data: string, tipo: string) {
    const chave = `${usuarioId}_${data}`;
    const baseTipo = escalasBase.find((e) => e.usuarioId === usuarioId && e.data.slice(0, 10) === data)?.tipo;
    const atual = mapa.get(chave)?.tipo;

    setRascunho((prev) => {
      const proximo = { ...prev };
      if (atual === tipo) {
        // Toggle: limpar o dia.
        if (baseTipo !== undefined) proximo[chave] = null;
        else delete proximo[chave];
      } else {
        if (baseTipo === tipo) delete proximo[chave]; // voltou ao valor do banco
        else proximo[chave] = tipo;
      }
      return proximo;
    });
  }

  function removerDia(usuarioId: string, data: string) {
    const chave = `${usuarioId}_${data}`;
    const baseTipo = escalasBase.find((e) => e.usuarioId === usuarioId && e.data.slice(0, 10) === data)?.tipo;
    setRascunho((prev) => {
      const proximo = { ...prev };
      if (baseTipo !== undefined) proximo[chave] = null;
      else delete proximo[chave];
      return proximo;
    });
  }

  async function salvarTudo() {
    if (qtdAlteracoes === 0) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const alteracoes = Object.entries(rascunho).map(([chave, tipo]) => {
        const [usuarioId, data] = chave.split("_");
        return { usuarioId, data, tipo };
      });
      const res = await fetch("/api/v1/escalas/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes: mesAtivo, alteracoes }),
      });
      const json = await res.json();
      if (!res.ok) { setErroSalvar(json?.error ?? "Não foi possível salvar."); return; }
      setEscalasBase(json.escalas);
      setRascunho({});
    } catch {
      setErroSalvar("Erro de conexão ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function descartarTudo() {
    setRascunho({});
    setErroSalvar(null);
  }

  async function adicionarAvulso() {
    if (!nomeAvulso.trim()) return;
    setAdicionando(true);
    setErroAvulso(null);
    try {
      const res = await fetch("/api/v1/admin/usuarios/avulso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeAvulso.trim(), setor: (setorConfigurador ?? setorAvulso).trim() || "Geral" }),
      });
      const json = await res.json();
      if (!res.ok) { setErroAvulso(json?.error ?? "Não foi possível adicionar."); return; }
      setUsuarios((prev) => [...prev, { id: json.id, nomeCompleto: json.nomeCompleto, setor: json.setor, temApp: false, fotoUrl: null }]);
      setNomeAvulso("");
      setSetorAvulso(setorConfigurador ?? "Geral");
      setMostrarAvulso(false);
    } catch { setErroAvulso("Erro de conexão."); }
    finally { setAdicionando(false); }
  }

  async function salvarSegredo() {
    setSalvandoSegredo(true);
    setMsgSegredo(null);
    try {
      const res = await fetch("/api/v1/setores/palavra-secreta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palavraSecreta: segredo.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setMsgSegredo(json?.error ?? "Não foi possível salvar."); return; }
      setTemPalavra(!!json.temPalavra);
      setSegredo("");
      setMostrarSegredo(false);
    } catch { setMsgSegredo("Erro de conexão."); }
    finally { setSalvandoSegredo(false); }
  }

  function baixarArquivo(href: string, nome: string) {
    const a = document.createElement("a");
    a.href = href; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function exportarImagem() {
    if (!exportRef.current) return;
    setMenuExport(false); setExportando("png");
    try {
      const { toPng } = await import("html-to-image");
      const bg = getComputedStyle(document.body).backgroundColor || "#ffffff";
      const url = await toPng(exportRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: bg });
      baixarArquivo(url, `escala-${mesAtivo ?? "mes"}.png`);
    } catch { /* silencioso */ } finally { setExportando(null); }
  }

  async function exportarPdf() {
    setMenuExport(false); setExportando("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const linhas = montarLinhasFds(usuarios, escalasEfetivas, diasDoMes);
      const fmt = (iso: string) => { const [a, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${a}`; };
      const nomeMes = mesAtivo
        ? (() => { const [a, m] = mesAtivo.split("-").map(Number); return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); })()
        : "";
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      doc.setFontSize(14);
      doc.text(`Escala de fim de semana${nomeMes ? " — " + nomeMes : ""}`, 40, 40);
      autoTable(doc, {
        startY: 56,
        head: [["Data", "Plantão FDS", "Sábado Expediente", "Sábado de Folga"]],
        body: linhas.map((l) => [`${fmt(l.sab)} e ${fmt(l.dom)}`, l.plantao.join(" / "), l.expediente.join(" / "), l.folga.join(" / ")]),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      const comHo = linhas.filter((l) => l.homeOffice.length > 0);
      if (comHo.length > 0) {
        const docAny = doc as unknown as { lastAutoTable?: { finalY: number } };
        let y = (docAny.lastAutoTable?.finalY ?? 56) + 24;
        doc.setFontSize(11); doc.text("Home office no sábado (14h - 22h)", 40, y); doc.setFontSize(9);
        for (const l of comHo) { y += 16; doc.text(`${fmt(l.sab)} — ${l.homeOffice.join(", ")}`, 40, y); }
      }
      doc.save(`escala-${mesAtivo ?? "mes"}.pdf`);
    } catch { /* silencioso */ } finally { setExportando(null); }
  }

  function exportarExcel() {
    setMenuExport(false);
    baixarArquivo(`/api/v1/escalas/export?mes=${mesAtivo ?? ""}`, `escala-${mesAtivo ?? "mes"}.xlsx`);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de rascunho — só aparece quando há alterações não salvas */}
      {qtdAlteracoes > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 shadow-sm dark:border-amber-800 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {qtdAlteracoes} alteração(ões) não salva(s) — as edições ficam guardadas no seu navegador até você salvar.
          </p>
          <div className="flex items-center gap-2">
            {erroSalvar && <span className="text-xs text-danger">{erroSalvar}</span>}
            <Button size="sm" variant="ghost" onClick={descartarTudo} disabled={salvando}>Descartar</Button>
            <Button size="sm" onClick={salvarTudo} loading={salvando}>Salvar alterações</Button>
          </div>
        </div>
      )}

      {/* Abas + palavra secreta + exportação */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {([["calendario", "Calendário"], ["fds", "Fim de semana"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                aba === id ? "bg-brand-blue text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800")}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Palavra secreta do setor (configurador) */}
          {setorConfigurador && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setMostrarSegredo((v) => !v)}>
                <svg viewBox="0 0 24 24" fill="none" className="mr-1.5 h-4 w-4">
                  <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 0h10.5a2.25 2.25 0 0 1 2.25 2.25v6A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75v-6a2.25 2.25 0 0 1 2.25-2.25Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {temPalavra ? "Palavra secreta ✓" : "Palavra secreta"}
              </Button>
              {mostrarSegredo && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMostrarSegredo(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                      Palavra secreta da escala pública do setor <b>{setorConfigurador}</b>. Quem tiver a palavra vê esta escala em <code>/escala</code>.
                    </p>
                    <PasswordInput placeholder={temPalavra ? "Vazio para remover" : "Defina uma palavra"} value={segredo} onChange={(e) => setSegredo(e.target.value)} />
                    {msgSegredo && <p className="mt-1 text-[11px] text-danger">{msgSegredo}</p>}
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={salvarSegredo} loading={salvandoSegredo}>Salvar</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {aba === "fds" && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setMenuExport((v) => !v)} loading={!!exportando}>
                <svg viewBox="0 0 24 24" fill="none" className="mr-1.5 h-4 w-4">
                  <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Exportar
              </Button>
              {menuExport && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuExport(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <button onClick={exportarExcel} disabled={!!exportando} className="block w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">Excel (.xlsx)</button>
                    <button onClick={exportarPdf} disabled={!!exportando} className="block w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">{exportando === "pdf" ? "Gerando PDF…" : "PDF"}</button>
                    <button onClick={exportarImagem} disabled={!!exportando} className="block w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">{exportando === "png" ? "Gerando imagem…" : "Imagem (PNG)"}</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {aba === "calendario" && (
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* ── Coluna esquerda: lista da equipe ── */}
      <div className="hidden w-44 shrink-0 flex-col gap-2 lg:flex">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Equipe ({usuarios.length})</p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {usuarios.map((u) => (
              <li key={u.id} className="flex items-center gap-2 px-3 py-2">
                {u.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.fotoUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[9px] font-bold text-white">{iniciais(u.nomeCompleto)}</span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100" title={u.nomeCompleto}>{u.nomeCompleto}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{u.setor}{!u.temApp && " · avulso"}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {!mostrarAvulso ? (
          <button onClick={() => setMostrarAvulso(true)}
            className="rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-brand-blue hover:text-brand-blue dark:border-slate-700 dark:text-slate-400 transition-colors">
            + Membro avulso
          </button>
        ) : (
          <Card className="flex flex-col gap-3 p-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Membro avulso</p>
            <Input placeholder="Nome" value={nomeAvulso} onChange={(e) => setNomeAvulso(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionarAvulso()} autoFocus className="h-8 text-xs" />
            {setorConfigurador ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Será criado no setor <b>{setorConfigurador}</b>.</p>
            ) : (
              <Input placeholder="Setor (opcional)" value={setorAvulso} onChange={(e) => setSetorAvulso(e.target.value)} className="h-8 text-xs" />
            )}
            {erroAvulso && <p className="text-[11px] text-danger">{erroAvulso}</p>}
            <div className="flex gap-1.5">
              <Button size="sm" onClick={adicionarAvulso} loading={adicionando} disabled={!nomeAvulso.trim()} className="flex-1 text-xs">Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => setMostrarAvulso(false)} className="text-xs">×</Button>
            </div>
          </Card>
        )}
      </div>

      {/* ── Centro: calendário mensal ── */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offsetInicio }).map((_, i) => (
            <div key={`vazio-${i}`} className="min-h-[80px] rounded-lg bg-slate-50 dark:bg-slate-900/20" />
          ))}

          {diasDoMes.map((dia) => {
            const numDia = Number(dia.slice(8));
            const ehHoje = dia === hoje;
            const ehSelecionado = dia === diaSelecionado;
            const escaladosNoDia = usuarios.map((u) => ({ u, e: mapa.get(`${u.id}_${dia}`) })).filter((x) => x.e);

            return (
              <button key={dia} onClick={() => setDiaSelecionado(ehSelecionado ? null : dia)}
                className={cn("min-h-[80px] rounded-lg border p-1.5 text-left transition-all",
                  ehSelecionado ? "border-brand-blue bg-brand-blue/5 ring-2 ring-brand-blue/30 dark:bg-brand-blue/10"
                    : ehHoje ? "border-brand-blue/40 bg-brand-blue/5 dark:bg-brand-blue/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700")}>
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                  ehHoje ? "bg-brand-blue font-bold text-white" : "text-slate-500 dark:text-slate-400")}>
                  {numDia}
                </span>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {escaladosNoDia.slice(0, 6).map(({ u, e }) => (<Avatar key={u.id} usuario={u} tipo={e!.tipo} size={18} />))}
                  {escaladosNoDia.length > 6 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-200 px-1 text-[9px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">+{escaladosNoDia.length - 6}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {TIPOS.map((t) => (
            <span key={t.valor} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className={cn("h-2.5 w-2.5 rounded-full ring-2", RING_TIPO[t.valor])} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Coluna direita: painel de ações ── */}
      <div className="w-full lg:w-72 lg:shrink-0">
        {diaSelecionado ? (
          <Card className="p-4">
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Editando</p>
              <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {new Date(diaSelecionado + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {usuarios.map((u) => {
                const chave = `${u.id}_${diaSelecionado}`;
                const escala = mapa.get(chave);
                const sabado = ehSabado(diaSelecionado);
                const indisponivelSabado = sabado && (escala?.tipo === "FOLGA" || escala?.tipo === "HOME_OFFICE");
                const horario = horarioDoTipo(escala?.tipo);

                return (
                  <div key={u.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {escala ? (<Avatar usuario={u} tipo={escala.tipo} size={20} />)
                          : u.fotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.fotoUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover opacity-40" />
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-500 dark:bg-slate-700">{iniciais(u.nomeCompleto)}</span>
                          )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100" title={u.nomeCompleto}>{u.nomeCompleto}</p>
                          {horario && <p className="text-[10px] font-medium text-brand-green-dark dark:text-brand-green">{horario}</p>}
                        </div>
                      </div>
                      {escala && (
                        <button onClick={() => removerDia(u.id, diaSelecionado)} title="Remover escala"
                          className="shrink-0 text-slate-300 hover:text-danger dark:text-slate-600 dark:hover:text-danger transition-colors">×</button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {TIPOS.map((t) => {
                        const ativo = escala?.tipo === t.valor;
                        const bloqueado = indisponivelSabado && (t.valor === "NORMAL" || t.valor === "PLANTAO");
                        return (
                          <button key={t.valor} onClick={() => definirTipo(u.id, diaSelecionado, t.valor)} disabled={bloqueado}
                            title={bloqueado ? "Indisponível: folga ou home office no sábado" : t.label}
                            className={cn("rounded px-2 py-0.5 text-[10px] font-semibold transition-all",
                              ativo ? COR_ATIVO[t.valor] : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
                              bloqueado && "opacity-40 cursor-not-allowed line-through")}>
                            {siglaTipoEscala(t.valor, diaSelecionado)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[10px] text-slate-400 dark:text-slate-500">
              Clique no tipo para atribuir. Clique novamente para remover. As alterações são salvas em lote no botão “Salvar alterações”.
            </p>
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Clique em um dia do calendário para editar as escalas da equipe.</p>
            <button onClick={() => setMostrarAvulso(!mostrarAvulso)} className="mt-2 text-xs font-medium text-brand-blue hover:underline lg:hidden">+ Membro avulso</button>
            {mostrarAvulso && (
              <div className="mt-3 w-full border-t border-slate-200 pt-4 dark:border-slate-800 lg:hidden">
                <div className="flex flex-col gap-3">
                  <Input placeholder="Nome" value={nomeAvulso} onChange={(e) => setNomeAvulso(e.target.value)} autoFocus className="h-8 text-xs" />
                  {setorConfigurador ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Será criado no setor <b>{setorConfigurador}</b>.</p>
                  ) : (
                    <Input placeholder="Setor (opcional)" value={setorAvulso} onChange={(e) => setSetorAvulso(e.target.value)} className="h-8 text-xs" />
                  )}
                  {erroAvulso && <p className="text-[11px] text-danger">{erroAvulso}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={adicionarAvulso} loading={adicionando} disabled={!nomeAvulso.trim()} className="flex-1 text-xs">Adicionar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setMostrarAvulso(false)} className="text-xs">Cancelar</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
        </div>
      </div>
      )}

      {aba === "fds" && (
        <EscalaFimDeSemana ref={exportRef} usuarios={usuarios} escalas={escalasEfetivas} diasDoMes={diasDoMes} mesAtivo={mesAtivo} />
      )}
    </div>
  );
}
