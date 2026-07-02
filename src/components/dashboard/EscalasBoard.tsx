"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { cn } from "@/lib/utils";
import {
  type EtiquetaEscala,
  etiquetasDoSetor,
  resolverEtiqueta,
  siglaEtiqueta,
  diaDaSemanaUTC,
  parFimDeSemana,
  sabadoDaSemana,
  somarDias,
  formatarJornada,
  ETIQUETAS_PADRAO,
} from "@/lib/escala";
import { EscalaFimDeSemana, montarLinhasFds } from "@/components/dashboard/EscalaFimDeSemana";

export interface UsuarioResumo {
  id: string;
  nomeCompleto: string;
  setor: string;
  setores?: string[];
  temApp: boolean;
  fotoUrl: string | null;
  modeloHorario?: { jornadaPlantao: number } | null;
}

export interface EscalaView {
  id: string;
  usuarioId: string;
  data: string;
  tipo: string;
  etiquetaId?: string | null;
  observacao: string | null;
}

/** Valor de um dia no rascunho: etiqueta atribuída ou null (remover). */
type DiaRascunho = { tipo: string; etiquetaId: string | null } | null;

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function iniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function Avatar({ usuario, cor, titulo, size = 20 }: { usuario: UsuarioResumo; cor: string; titulo: string; size?: number }) {
  const anel = { boxShadow: `0 0 0 2px ${cor}` };
  if (usuario.fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={usuario.fotoUrl} alt={usuario.nomeCompleto} title={titulo}
        width={size} height={size} className="inline-flex shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, ...anel }} />
    );
  }
  const cores = ["#3b82f6","#22c55e","#a855f7","#f59e0b","#ef4444","#14b8a6","#ec4899","#6366f1"];
  const corFundo = cores[usuario.nomeCompleto.charCodeAt(0) % cores.length];
  return (
    <span title={titulo}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: corFundo, ...anel }}>
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
  meusSetores,
  setorTemPalavra,
  etiquetasPorSetorJson,
  somenteLeitura = false,
}: {
  usuarios: UsuarioResumo[];
  escalasIniciais: EscalaView[];
  diasDoMes: string[];
  mesAtivo?: string;
  ehAdmin: boolean;
  /** Setores do configurador ([] para admin). */
  meusSetores: string[];
  setorTemPalavra: boolean;
  /** JSON salvo de Setor.etiquetas por nome de setor. */
  etiquetasPorSetorJson: Record<string, unknown>;
  /** Usuário comum: só visualiza a escala do(s) próprio(s) setor(es). */
  somenteLeitura?: boolean;
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [escalasBase, setEscalasBase] = useState(escalasIniciais);
  const [rascunho, setRascunho] = useState<Record<string, DiaRascunho>>({});
  const [carregouRascunho, setCarregouRascunho] = useState(false);
  const [diaAberto, setDiaAberto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [etiquetasJson, setEtiquetasJson] = useState(etiquetasPorSetorJson);
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({});
  const [editandoEtiquetasDe, setEditandoEtiquetasDe] = useState<string | null>(null);

  const chaveRascunho = `kronos_escala_rascunho_v2_${mesAtivo ?? "mes"}`;

  // Carrega/persiste o rascunho (localStorage) — efeito p/ evitar mismatch de hidratação.
  useEffect(() => {
    try {
      localStorage.removeItem(`kronos_escala_rascunho_${mesAtivo ?? "mes"}`); // formato antigo
      const salvo = localStorage.getItem(chaveRascunho);
      if (salvo) setRascunho(JSON.parse(salvo));
    } catch { /* ignora */ }
    setCarregouRascunho(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!carregouRascunho) return;
    try {
      if (Object.keys(rascunho).length === 0) localStorage.removeItem(chaveRascunho);
      else localStorage.setItem(chaveRascunho, JSON.stringify(rascunho));
    } catch { /* ignora */ }
  }, [rascunho, carregouRascunho, chaveRascunho]);

  // Trava o scroll da página enquanto um modal do board está aberto.
  useEffect(() => {
    const aberto = !!diaAberto || !!editandoEtiquetasDe;
    if (aberto) {
      const anterior = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = anterior; };
    }
  }, [diaAberto, editandoEtiquetasDe]);

  // ── Etiquetas por setor ──
  const etiquetasDe = useMemo(() => {
    const cache = new Map<string, EtiquetaEscala[]>();
    return (setor: string): EtiquetaEscala[] => {
      if (!cache.has(setor)) cache.set(setor, etiquetasDoSetor(etiquetasJson[setor]));
      return cache.get(setor)!;
    };
  }, [etiquetasJson]);

  const podeEditarEtiquetas = (setor: string) => ehAdmin || meusSetores.includes(setor);

  // ── Estado efetivo: base + rascunho ──
  const mapaBase = useMemo(() => {
    const m = new Map<string, { tipo: string; etiquetaId: string | null }>();
    for (const e of escalasBase) m.set(`${e.usuarioId}_${e.data.slice(0, 10)}`, { tipo: e.tipo, etiquetaId: e.etiquetaId ?? null });
    return m;
  }, [escalasBase]);

  const mapa = useMemo(() => {
    const m = new Map<string, { tipo: string; etiquetaId: string | null }>(mapaBase);
    for (const [chave, valor] of Object.entries(rascunho)) {
      if (valor === null) m.delete(chave);
      else m.set(chave, valor);
    }
    return m;
  }, [mapaBase, rascunho]);

  const escalasEfetivas = useMemo<EscalaView[]>(() =>
    Array.from(mapa.entries()).map(([chave, v]) => {
      const sep = chave.indexOf("_");
      return { id: `efetiva-${chave}`, usuarioId: chave.slice(0, sep), data: chave.slice(sep + 1), tipo: v.tipo, etiquetaId: v.etiquetaId, observacao: null };
    }), [mapa]);

  const qtdAlteracoes = Object.keys(rascunho).length;

  // ── Abas por setor (somente leitura, quando o usuário tem mais de um) ──
  const [setorAba, setSetorAba] = useState<string | null>(null);
  const setoresDisponiveis = useMemo(
    () => [...new Set(usuarios.map((u) => u.setor || "Sem setor"))].sort((a, b) => a.localeCompare(b)),
    [usuarios]
  );
  const setorAtivo = somenteLeitura && setoresDisponiveis.length > 1
    ? (setorAba ?? setoresDisponiveis[0])
    : null;
  const usuariosVisiveis = useMemo(
    () => (setorAtivo ? usuarios.filter((u) => (u.setor || "Sem setor") === setorAtivo) : usuarios),
    [usuarios, setorAtivo]
  );

  // ── Grupos por setor (admin/multi-setor: agrupado com expansão) ──
  const grupos = useMemo(() => {
    const porSetor = new Map<string, UsuarioResumo[]>();
    for (const u of usuariosVisiveis) {
      const s = u.setor || "Sem setor";
      if (!porSetor.has(s)) porSetor.set(s, []);
      porSetor.get(s)!.push(u);
    }
    return Array.from(porSetor.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [usuariosVisiveis]);

  const grupoAberto = (setor: string) => gruposAbertos[setor] ?? true;

  // ── Semana de plantão ──
  function plantaoDoFimDeSemana(u: UsuarioResumo, diaISO: string): boolean {
    const sab = sabadoDaSemana(diaISO);
    const dom = somarDias(sab, 1);
    return mapa.get(`${u.id}_${sab}`)?.tipo === "PLANTAO" || mapa.get(`${u.id}_${dom}`)?.tipo === "PLANTAO";
  }

  function badgeSemanaPlantao(u: UsuarioResumo, diaISO: string): string | null {
    const dia = diaDaSemanaUTC(diaISO);
    if (dia === 0 || dia === 6) return null; // o aviso vale para os dias úteis
    if (!plantaoDoFimDeSemana(u, diaISO)) return null;
    return `Semana de plantão · ${formatarJornada(u.modeloHorario?.jornadaPlantao ?? 7.5)}`;
  }

  // ── Ações de rascunho ──

  function setarRascunho(chave: string, valor: DiaRascunho) {
    setRascunho((prev) => {
      const proximo = { ...prev };
      const base = mapaBase.get(chave);
      const igualBase = valor === null
        ? base === undefined
        : !!base && base.tipo === valor.tipo && (base.etiquetaId ?? null) === (valor.etiquetaId ?? null);
      if (igualBase) delete proximo[chave];
      else proximo[chave] = valor;
      return proximo;
    });
  }

  function atribuir(u: UsuarioResumo, diaISO: string, etiqueta: EtiquetaEscala) {
    if (somenteLeitura) return;
    const chave = `${u.id}_${diaISO}`;
    const atual = mapa.get(chave);
    const jaAtiva = !!atual && resolverEtiqueta(etiquetasDe(u.setor), atual.etiquetaId, atual.tipo).id === etiqueta.id;

    const par = etiqueta.tipo === "PLANTAO" ? parFimDeSemana(diaISO) : null;

    if (jaAtiva) {
      // Toggle: remover (plantão de fim de semana remove o par).
      if (par) {
        setarRascunho(`${u.id}_${par.sab}`, null);
        setarRascunho(`${u.id}_${par.dom}`, null);
      } else {
        setarRascunho(chave, null);
      }
      return;
    }

    const valor = { tipo: etiqueta.tipo, etiquetaId: etiqueta.id };
    if (par) {
      // Plantão no sábado OU no domingo marca os dois dias do fim de semana.
      setarRascunho(`${u.id}_${par.sab}`, valor);
      setarRascunho(`${u.id}_${par.dom}`, valor);
    } else {
      setarRascunho(chave, valor);
    }
  }

  function removerDia(u: UsuarioResumo, diaISO: string) {
    if (somenteLeitura) return;
    const chave = `${u.id}_${diaISO}`;
    const atual = mapa.get(chave);
    const par = atual?.tipo === "PLANTAO" ? parFimDeSemana(diaISO) : null;
    if (par) {
      setarRascunho(`${u.id}_${par.sab}`, null);
      setarRascunho(`${u.id}_${par.dom}`, null);
    } else {
      setarRascunho(chave, null);
    }
  }

  async function salvarTudo() {
    if (qtdAlteracoes === 0) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const alteracoes = Object.entries(rascunho).map(([chave, valor]) => {
        const sep = chave.indexOf("_");
        return {
          usuarioId: chave.slice(0, sep),
          data: chave.slice(sep + 1),
          tipo: valor?.tipo ?? null,
          etiquetaId: valor?.etiquetaId ?? null,
        };
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

  // ── Membro avulso ──
  const [mostrarAvulso, setMostrarAvulso] = useState(false);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [setorAvulso, setSetorAvulso] = useState(meusSetores[0] ?? "");
  const [adicionando, setAdicionando] = useState(false);
  const [erroAvulso, setErroAvulso] = useState<string | null>(null);

  async function adicionarAvulso() {
    if (!nomeAvulso.trim()) return;
    setAdicionando(true);
    setErroAvulso(null);
    try {
      const res = await fetch("/api/v1/admin/usuarios/avulso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeAvulso.trim(), setor: setorAvulso.trim() || meusSetores[0] || "Geral" }),
      });
      const json = await res.json();
      if (!res.ok) { setErroAvulso(json?.error ?? "Não foi possível adicionar."); return; }
      setUsuarios((prev) => [...prev, { id: json.id, nomeCompleto: json.nomeCompleto, setor: json.setor, temApp: false, fotoUrl: null }]);
      setNomeAvulso("");
      setMostrarAvulso(false);
    } catch { setErroAvulso("Erro de conexão."); }
    finally { setAdicionando(false); }
  }

  // ── Palavra secreta (configurador) ──
  const [mostrarSegredo, setMostrarSegredo] = useState(false);
  const [segredoSetor, setSegredoSetor] = useState(meusSetores[0] ?? "");
  const [segredo, setSegredo] = useState("");
  const [salvandoSegredo, setSalvandoSegredo] = useState(false);
  const [temPalavra, setTemPalavra] = useState(setorTemPalavra);
  const [msgSegredo, setMsgSegredo] = useState<string | null>(null);

  async function salvarSegredo() {
    setSalvandoSegredo(true);
    setMsgSegredo(null);
    try {
      const res = await fetch("/api/v1/setores/palavra-secreta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setorNome: segredoSetor, palavraSecreta: segredo.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setMsgSegredo(json?.error ?? "Não foi possível salvar."); return; }
      setTemPalavra(!!json.temPalavra);
      setSegredo("");
      setMostrarSegredo(false);
    } catch { setMsgSegredo("Erro de conexão."); }
    finally { setSalvandoSegredo(false); }
  }

  // ── Exportação ──
  const exportRef = useRef<HTMLDivElement>(null);
  const [menuExport, setMenuExport] = useState(false);
  const [exportando, setExportando] = useState<string | null>(null);
  const [aba, setAba] = useState<"calendario" | "geral">("calendario");

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
      doc.text(`Visualização geral${nomeMes ? " — " + nomeMes : ""}`, 40, 40);
      autoTable(doc, {
        startY: 56,
        head: [["Data", "Plantão FDS", "Sábado Expediente", "Sábado de Folga"]],
        body: linhas.map((l) => [`${fmt(l.sab)} e ${fmt(l.dom)}`, l.plantao.join(" / "), l.expediente.join(" / "), l.folga.join(" / ")]),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      doc.save(`escala-${mesAtivo ?? "mes"}.pdf`);
    } catch { /* silencioso */ } finally { setExportando(null); }
  }

  function exportarExcel() {
    setMenuExport(false);
    baixarArquivo(`/api/v1/escalas/export?mes=${mesAtivo ?? ""}`, `escala-${mesAtivo ?? "mes"}.xlsx`);
  }

  // ── Editor de etiquetas ──
  const [etiquetasEdicao, setEtiquetasEdicao] = useState<EtiquetaEscala[]>([]);
  const [salvandoEtiquetas, setSalvandoEtiquetas] = useState(false);
  const [erroEtiquetas, setErroEtiquetas] = useState<string | null>(null);

  function abrirEditorEtiquetas(setor: string) {
    setEtiquetasEdicao(etiquetasDe(setor).map((e) => ({ ...e })));
    setErroEtiquetas(null);
    setEditandoEtiquetasDe(setor);
  }

  async function salvarEtiquetas() {
    if (!editandoEtiquetasDe) return;
    setSalvandoEtiquetas(true);
    setErroEtiquetas(null);
    try {
      const res = await fetch("/api/v1/setores/etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setorNome: editandoEtiquetasDe, etiquetas: etiquetasEdicao }),
      });
      const json = await res.json();
      if (!res.ok) { setErroEtiquetas(json?.error ?? "Não foi possível salvar."); return; }
      setEtiquetasJson((prev) => ({ ...prev, [editandoEtiquetasDe]: json.etiquetas }));
      setEditandoEtiquetasDe(null);
    } catch { setErroEtiquetas("Erro de conexão."); }
    finally { setSalvandoEtiquetas(false); }
  }

  // ── Auxiliares de render ──
  const offsetInicio = useMemo(() => {
    if (!diasDoMes.length) return 0;
    return diaDaSemanaUTC(diasDoMes[0]);
  }, [diasDoMes]);

  const hoje = new Date().toISOString().slice(0, 10);

  const TIPOS_BASE_EDITOR = [
    { valor: "NORMAL", label: "Normal (dia comum)" },
    { valor: "PLANTAO", label: "Plantão (marca sáb+dom)" },
    { valor: "FOLGA", label: "Folga" },
    { valor: "DOMINGO_EFETIVO", label: "Domingo efetivo (só domingos)" },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de rascunho — só aparece quando há alterações não salvas */}
      {qtdAlteracoes > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 shadow-sm dark:border-amber-800 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {qtdAlteracoes} alteração(ões) não salva(s) — as edições ficam no seu navegador até você salvar.
          </p>
          <div className="flex items-center gap-2">
            {erroSalvar && <span className="text-xs text-danger">{erroSalvar}</span>}
            <Button size="sm" variant="ghost" onClick={descartarTudo} disabled={salvando}>Descartar</Button>
            <Button size="sm" onClick={salvarTudo} loading={salvando}>Salvar alterações</Button>
          </div>
        </div>
      )}

      {/* Toolbar: abas + avulso + palavra secreta + exportação */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {([["calendario", "Calendário"], ["geral", "Visualização geral"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                aba === id ? "bg-brand-blue text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800")}>
              {label}
            </button>
          ))}

          {/* Abas por setor (somente leitura com mais de um setor) */}
          {setorAtivo && (
            <div className="ml-2 flex gap-1 border-l border-slate-200 pl-3 dark:border-slate-800">
              {setoresDisponiveis.map((s) => (
                <button key={s} onClick={() => setSetorAba(s)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    setorAtivo === s
                      ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800")}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {!somenteLeitura && (
        <div className="flex items-center gap-2">
          {/* Membro avulso */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setMostrarAvulso((v) => !v)}>+ Membro avulso</Button>
            {mostrarAvulso && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMostrarAvulso(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    Cria um usuário-fantasma só para aparecer na escala (sem acesso ao sistema).
                  </p>
                  <div className="flex flex-col gap-2">
                    <Input placeholder="Nome" value={nomeAvulso} onChange={(e) => setNomeAvulso(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && adicionarAvulso()} autoFocus className="h-9 text-sm" />
                    {meusSetores.length > 1 ? (
                      <select value={setorAvulso} onChange={(e) => setSetorAvulso(e.target.value)}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                        {meusSetores.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : meusSetores.length === 1 ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Será criado no setor <b>{meusSetores[0]}</b>.</p>
                    ) : (
                      <Input placeholder="Setor" value={setorAvulso} onChange={(e) => setSetorAvulso(e.target.value)} className="h-9 text-sm" />
                    )}
                    {erroAvulso && <p className="text-[11px] text-danger">{erroAvulso}</p>}
                    <Button size="sm" onClick={adicionarAvulso} loading={adicionando} disabled={!nomeAvulso.trim()}>Adicionar</Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Palavra secreta do setor (configurador; admin gerencia em Setores) */}
          {!ehAdmin && meusSetores.length > 0 && (
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
                      Quem tiver a palavra vê a escala do setor em <code>/escala</code>, sem login.
                    </p>
                    {meusSetores.length > 1 && (
                      <select value={segredoSetor} onChange={(e) => setSegredoSetor(e.target.value)}
                        className="mb-2 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                        {meusSetores.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
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

          {aba === "geral" && (
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
        )}
      </div>

      {/* ── Calendário em tela cheia ── */}
      {aba === "calendario" && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 grid grid-cols-7 gap-1.5">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="py-1 text-center text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: offsetInicio }).map((_, i) => (
                <div key={`vazio-${i}`} className="min-h-[104px] rounded-xl bg-slate-50 dark:bg-slate-900/20" />
              ))}

              {diasDoMes.map((dia) => {
                const numDia = Number(dia.slice(8));
                const ehHoje = dia === hoje;
                const escaladosNoDia = usuariosVisiveis
                  .map((u) => ({ u, e: mapa.get(`${u.id}_${dia}`) }))
                  .filter((x): x is { u: UsuarioResumo; e: { tipo: string; etiquetaId: string | null } } => !!x.e);

                return (
                  <button key={dia} onClick={() => setDiaAberto(dia)}
                    className={cn(
                      "group relative min-h-[104px] rounded-xl border p-2 text-left transition-all",
                      ehHoje
                        ? "border-brand-blue/50 bg-brand-blue/5 dark:bg-brand-blue/10"
                        : "border-slate-200 hover:border-brand-blue/40 hover:shadow-sm dark:border-slate-800 dark:hover:border-brand-blue/40"
                    )}>
                    <div className="flex items-start justify-between">
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        ehHoje ? "bg-brand-blue font-bold text-white" : "text-slate-500 dark:text-slate-400")}>
                        {numDia}
                      </span>
                      <span className="hidden items-center gap-1 rounded-md bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-blue group-hover:inline-flex">
                        {somenteLeitura ? "Ver" : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Editar
                          </>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {escaladosNoDia.slice(0, 8).map(({ u, e }) => {
                        const et = resolverEtiqueta(etiquetasDe(u.setor), e.etiquetaId, e.tipo);
                        return <Avatar key={u.id} usuario={u} cor={et.cor} titulo={`${u.nomeCompleto} · ${et.nome}`} size={22} />;
                      })}
                      {escaladosNoDia.length > 8 && (
                        <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          +{escaladosNoDia.length - 8}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legenda por setor (nomes editáveis) */}
          <div className="flex flex-col gap-2">
            {grupos.map(([setor]) => (
              <div key={setor} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{setor}</span>
                {etiquetasDe(setor).map((et) => (
                  <span key={et.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: et.cor }} />
                    {et.nome}
                  </span>
                ))}
                {!somenteLeitura && podeEditarEtiquetas(setor) && (
                  <button onClick={() => abrirEditorEtiquetas(setor)}
                    className="ml-auto text-xs font-medium text-brand-blue hover:underline">
                    Editar etiquetas
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Visualização geral (antiga "Fim de semana") ── */}
      {aba === "geral" && (
        <EscalaFimDeSemana ref={exportRef} usuarios={usuariosVisiveis} escalas={escalasEfetivas} diasDoMes={diasDoMes} mesAtivo={mesAtivo} />
      )}

      {/* ── Modal de edição do dia ── */}
      {diaAberto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="animate-overlay absolute inset-0 bg-slate-900/50" onClick={() => setDiaAberto(null)} />
          <div className="animate-modal relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 pb-4 dark:border-slate-800">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {somenteLeitura ? "Escala do dia" : "Editando escala"}
                </p>
                <p className="font-display text-lg font-semibold capitalize text-slate-900 dark:text-white">
                  {new Date(diaAberto + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDiaAberto(somarDias(diaAberto, -1))} title="Dia anterior"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setDiaAberto(somarDias(diaAberto, 1))} title="Próximo dia"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setDiaAberto(null)} aria-label="Fechar"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>

            {/* Corpo: grupos por setor */}
            <div className="flex-1 overflow-y-auto p-5 pt-3">
              {grupos.map(([setor, membros]) => {
                const etiquetas = etiquetasDe(setor);
                const aberto = grupoAberto(setor);
                const ehDomingo = diaDaSemanaUTC(diaAberto) === 0;
                const ehSabadoDia = diaDaSemanaUTC(diaAberto) === 6;

                return (
                  <div key={setor} className="mb-2">
                    {/* Cabeçalho do grupo (expansível) */}
                    <button onClick={() => setGruposAbertos((p) => ({ ...p, [setor]: !aberto }))}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <svg viewBox="0 0 24 24" fill="none"
                        className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", aberto && "rotate-90")}>
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{setor}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">({membros.length})</span>
                    </button>

                    {aberto && (
                      <div className="mt-1 flex flex-col gap-3 pl-2">
                        {membros.map((u) => {
                          const chave = `${u.id}_${diaAberto}`;
                          const atual = mapa.get(chave);
                          const etAtual = atual ? resolverEtiqueta(etiquetas, atual.etiquetaId, atual.tipo) : null;
                          const badge = badgeSemanaPlantao(u, diaAberto);
                          const folgaNoSabado = ehSabadoDia && atual?.tipo === "FOLGA";

                          return (
                            <div key={u.id} className="flex flex-col gap-1.5 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                              {/* Identificação */}
                              <div className="flex min-w-0 items-center gap-2">
                                <Avatar usuario={u} cor={etAtual?.cor ?? "#cbd5e1"} titulo={u.nomeCompleto} size={26} />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100" title={u.nomeCompleto}>
                                    {u.nomeCompleto}
                                  </p>
                                  {badge ? (
                                    <p className="text-[10px] font-semibold text-brand-blue">{badge}</p>
                                  ) : etAtual ? (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{etAtual.nome}</p>
                                  ) : null}
                                </div>
                              </div>

                              {/* Etiquetas ao lado (leitura: só a etiqueta do dia) */}
                              {somenteLeitura ? (
                                etAtual ? (
                                  <span className="rounded-md px-2 py-1 text-[11px] font-semibold"
                                    style={{ backgroundColor: `${etAtual.cor}1a`, color: etAtual.cor }}>
                                    {etAtual.nome}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                                )
                              ) : (
                              <div className="flex flex-wrap items-center gap-1">
                                {etiquetas.map((et) => {
                                  const ativa = etAtual?.id === et.id;
                                  const bloqueadaDomingo = et.tipo === "DOMINGO_EFETIVO" && !ehDomingo;
                                  const bloqueadaSabado = folgaNoSabado && (et.tipo === "PLANTAO" || et.tipo === "NORMAL");
                                  const bloqueada = bloqueadaDomingo || bloqueadaSabado;
                                  return (
                                    <button key={et.id}
                                      onClick={() => atribuir(u, diaAberto, et)}
                                      disabled={bloqueada}
                                      title={
                                        bloqueadaDomingo ? "Domingo efetivo só pode ser usado em domingos"
                                        : bloqueadaSabado ? "Este colaborador está de folga neste sábado"
                                        : et.tipo === "PLANTAO" && (ehSabadoDia || ehDomingo) ? `${et.nome} — marca sábado e domingo`
                                        : et.nome
                                      }
                                      className={cn(
                                        "rounded-md px-2 py-1 text-[10px] font-semibold transition-all",
                                        bloqueada && "cursor-not-allowed opacity-30 line-through"
                                      )}
                                      style={ativa
                                        ? { backgroundColor: et.cor, color: "#fff" }
                                        : { backgroundColor: `${et.cor}1a`, color: et.cor }}>
                                      {siglaEtiqueta(et.nome)}
                                    </button>
                                  );
                                })}
                                {etAtual && (
                                  <button onClick={() => removerDia(u, diaAberto)} title="Remover escala do dia"
                                    className="ml-0.5 rounded-md px-1.5 py-1 text-slate-300 hover:text-danger dark:text-slate-600 dark:hover:text-danger">
                                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                                  </button>
                                )}
                              </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {!somenteLeitura && (
                <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                  Plantão em sábado/domingo marca os dois dias. As alterações ficam no rascunho até “Salvar alterações”.
                </p>
              )}
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {somenteLeitura ? "Somente visualização" : qtdAlteracoes > 0 ? `${qtdAlteracoes} alteração(ões) no rascunho` : "Nenhuma alteração pendente"}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDiaAberto(null)}>Fechar</Button>
                {!somenteLeitura && qtdAlteracoes > 0 && <Button size="sm" onClick={salvarTudo} loading={salvando}>Salvar alterações</Button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal do editor de etiquetas ── */}
      {editandoEtiquetasDe && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="animate-overlay absolute inset-0 bg-slate-900/50" onClick={() => setEditandoEtiquetasDe(null)} />
          <div className="animate-modal relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 pb-4 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Etiquetas de {editandoEtiquetasDe}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Renomeie, mude a cor ou o comportamento. O comportamento define as regras do dia (par de fim de semana, folga…).
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pt-3">
              <div className="flex flex-col gap-2">
                {etiquetasEdicao.map((et, i) => (
                  <div key={et.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                    <input type="color" value={et.cor} title="Cor da etiqueta"
                      onChange={(e) => setEtiquetasEdicao((prev) => prev.map((x, j) => j === i ? { ...x, cor: e.target.value } : x))}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
                    <input type="text" value={et.nome} placeholder="Nome da etiqueta"
                      onChange={(e) => setEtiquetasEdicao((prev) => prev.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                    <select value={et.tipo}
                      onChange={(e) => setEtiquetasEdicao((prev) => prev.map((x, j) => j === i ? { ...x, tipo: e.target.value as EtiquetaEscala["tipo"] } : x))}
                      className="h-9 w-44 shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      {TIPOS_BASE_EDITOR.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                    </select>
                    <button onClick={() => setEtiquetasEdicao((prev) => prev.filter((_, j) => j !== i))}
                      disabled={etiquetasEdicao.length <= 1}
                      title="Remover etiqueta"
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger disabled:opacity-30 dark:hover:bg-red-950/30">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setEtiquetasEdicao((prev) => [...prev, {
                  id: `et-${Date.now().toString(36)}`,
                  nome: "",
                  cor: "#64748b",
                  tipo: "NORMAL",
                }])}
                disabled={etiquetasEdicao.length >= 12}
                className="mt-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 dark:border-slate-700 dark:text-slate-400">
                + Adicionar etiqueta
              </button>

              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                Dias já marcados com uma etiqueta removida continuam válidos: passam a exibir a etiqueta padrão do comportamento.
              </p>
              {erroEtiquetas && <p className="mt-2 text-sm text-danger">{erroEtiquetas}</p>}
            </div>

            <div className="flex justify-between gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setEtiquetasEdicao(ETIQUETAS_PADRAO.map((e) => ({ ...e })))}>
                Restaurar padrão
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditandoEtiquetasDe(null)}>Cancelar</Button>
                <Button size="sm" onClick={salvarEtiquetas} loading={salvandoEtiquetas}
                  disabled={etiquetasEdicao.some((e) => !e.nome.trim())}>
                  Salvar etiquetas
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
