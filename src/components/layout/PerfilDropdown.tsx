"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn, escurecerHex } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/ColorPicker";

type TemaBase = "claro" | "escuro" | "noturno";
type Aba = "foto" | "senha" | "tema" | null;

interface TemaConfig { textColor?: string; borderColor?: string; activeColor?: string; secondaryColor?: string }

interface PerfilDropdownProps {
  nomeCompleto: string;
  papel: string;
  fotoUrl: string | null;
  temaBase?: string | null;
  corDestaque?: string | null;
  temaConfig?: TemaConfig | null;
}

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0,2).map(p => p[0].toUpperCase()).join("");
}

export function PerfilDropdown({ nomeCompleto, papel, fotoUrl, temaBase, corDestaque, temaConfig }: PerfilDropdownProps) {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<Aba>(null);
  const [carregando, setCarregando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaVis1, setSenhaVis1] = useState(false);
  const [senhaVis2, setSenhaVis2] = useState(false);
  const [config, setConfig] = useState<TemaConfig>(temaConfig ?? {});
  const [accent, setAccent] = useState<string>(corDestaque ?? "");
  const [temaAtivo, setTemaAtivo] = useState<TemaBase>(
    (temaBase as TemaBase) ?? "claro"
  );
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function patch(dados: Record<string, unknown>) {
    setCarregando(true); setMsg(null);
    try {
      const res = await fetch("/api/v1/usuarios/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = await res.json();
      if (!res.ok) { setMsg(json?.error ?? "Erro ao salvar."); return false; }
      return true;
    } catch { setMsg("Erro de conexão."); return false; }
    finally { setCarregando(false); }
  }

  async function enviarFoto(file: File) {
    setCarregando(true); setMsg(null);
    try {
      const form = new FormData();
      form.append("arquivo", file);
      const up = await fetch("/api/v1/fotos/upload", { method: "POST", body: form });
      const json = await up.json();
      if (!up.ok) { setMsg(json?.error ?? "Falha no upload."); return; }
      const ok = await patch({ fotoUrl: json.url });
      if (ok) { setMsg("Foto atualizada!"); router.refresh(); }
    } catch { setMsg("Erro de conexão."); }
    finally { setCarregando(false); }
  }

  async function salvarSenha() {
    if (!senhaAtual || !novaSenha) { setMsg("Preencha os dois campos."); return; }
    const ok = await patch({ senhaAtual, novaSenha });
    if (ok) { setMsg("Senha alterada!"); setSenhaAtual(""); setNovaSenha(""); }
  }

  async function salvarTema() {
    // Aplica imediatamente no DOM
    document.documentElement.dataset.tema = temaAtivo;
    document.documentElement.dataset.temaExplicito = "1";
    document.documentElement.classList.remove("dark","night");
    if (temaAtivo === "escuro" || temaAtivo === "noturno") document.documentElement.classList.add("dark");
    if (temaAtivo === "noturno") document.documentElement.classList.add("night");
    try { localStorage.setItem("kronos-tema", temaAtivo); } catch { /* ignore */ }
    // Aplica cores customizadas
    const vars: Record<string, string> = {};
    if (config.textColor)      vars["--user-text"]       = config.textColor;
    if (config.borderColor)    vars["--user-border"]      = config.borderColor;
    if (config.activeColor)    vars["--user-active"]      = config.activeColor;
    if (config.secondaryColor) vars["--user-secondary"]   = config.secondaryColor;
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

    // Cor principal (accent) — aplica também a variante escurecida do :hover.
    if (accent) {
      document.documentElement.style.setProperty("--accent-override", accent);
      document.documentElement.style.setProperty("--accent-override-dark", escurecerHex(accent));
    }

    const ok = await patch({ temaBase: temaAtivo, temaConfig: config, corDestaque: accent });
    if (ok) { setMsg("Tema salvo!"); router.refresh(); }
  }

  async function sair() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    // Recarga completa: garante que o cookie limpo seja relido pelo servidor e
    // leva direto para a landing, sem ficar preso no estado anterior.
    window.location.href = "/";
  }

  function fechar() { setAberto(false); setAba(null); setMsg(null); }

  const PAPEIS: Record<string, string> = {
    ADMIN: "Administrador", SUPORTE: "Suporte",
    CONFIGURADOR_ESCALA: "Configurador", USUARIO: "Usuário",
  };

  const TEMAS: { valor: TemaBase; label: string }[] = [
    { valor: "claro", label: "Claro" }, { valor: "escuro", label: "Escuro" }, { valor: "noturno", label: "Noturno" },
  ];

  return (
    <div className="relative">
      {/* Avatar botão */}
      <button
        onClick={() => { setAberto(v => !v); setAba(null); setMsg(null); }}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Avatar nome={nomeCompleto} fotoUrl={fotoUrl} size={32} />
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">{nomeCompleto.split(" ")[0]}</p>
          <p className="text-[11px] text-slate-500">{PAPEIS[papel] ?? papel}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400">
          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-20" onClick={fechar} />
          <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
              <Avatar nome={nomeCompleto} fotoUrl={fotoUrl} size={44} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{nomeCompleto}</p>
                <p className="text-xs text-slate-500">{PAPEIS[papel] ?? papel}</p>
              </div>
            </div>

            {/* Menu itens */}
            {aba === null && (
              <div className="p-1.5">
                {[
                  { id: "foto" as Aba, label: "Alterar foto", icone: "M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" },
                  { id: "senha" as Aba, label: "Alterar senha", icone: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" },
                  { id: "tema" as Aba, label: "Ajustar tema", icone: "M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" },
                ].map(({ id, label, icone }) => (
                  <button key={id} onClick={() => setAba(id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
                      <path d={icone} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {label}
                  </button>
                ))}
                <hr className="my-1 border-slate-100 dark:border-slate-800" />
                <button onClick={sair}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-950/30">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
                    <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sair
                </button>
              </div>
            )}

            {/* Subpainel: Foto */}
            {aba === "foto" && (
              <SubPainel titulo="Alterar foto" onVoltar={() => { setAba(null); setMsg(null); }}>
                <div className="flex flex-col items-center gap-4">
                  <Avatar nome={nomeCompleto} fotoUrl={fotoUrl} size={72} />
                  <input ref={inputFotoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) enviarFoto(f); }} />
                  <div className="flex gap-2">
                    <button onClick={() => inputFotoRef.current?.click()} disabled={carregando}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-xs font-medium text-white hover:bg-brand-blue-dark disabled:opacity-50">
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Enviar arquivo
                    </button>
                    <button onClick={() => { inputFotoRef.current?.setAttribute("capture","user"); inputFotoRef.current?.click(); }}
                      disabled={carregando}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50">
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Câmera
                    </button>
                  </div>
                  {carregando && <p className="text-xs text-slate-500">Enviando…</p>}
                  {msg && <p className={cn("text-xs", msg.includes("!") ? "text-green-600" : "text-danger")}>{msg}</p>}
                </div>
              </SubPainel>
            )}

            {/* Subpainel: Senha */}
            {aba === "senha" && (
              <SubPainel titulo="Alterar senha" onVoltar={() => { setAba(null); setMsg(null); }}>
                <div className="flex flex-col gap-3">
                  <CampoSenha label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} visivel={senhaVis1} setVisivel={setSenhaVis1} />
                  <CampoSenha label="Nova senha" value={novaSenha} onChange={setNovaSenha} visivel={senhaVis2} setVisivel={setSenhaVis2} />
                  {msg && <p className={cn("text-xs", msg.includes("!") ? "text-green-600" : "text-danger")}>{msg}</p>}
                  <button onClick={salvarSenha} disabled={carregando}
                    className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark disabled:opacity-50">
                    {carregando ? "Salvando…" : "Salvar senha"}
                  </button>
                </div>
              </SubPainel>
            )}

            {/* Subpainel: Tema */}
            {aba === "tema" && (
              <SubPainel titulo="Ajustar tema" onVoltar={() => { setAba(null); setMsg(null); }}>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    {TEMAS.map(t => (
                      <button key={t.valor} onClick={() => setTemaAtivo(t.valor)}
                        className={cn("flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                          temaAtivo === t.valor
                            ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300")}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <ColorPicker label="Cor principal" value={accent || "#22c55e"} onChange={setAccent} />
                    <ColorPicker label="Cor do texto" value={config.textColor ?? "#0f172a"} onChange={v => setConfig(c => ({...c, textColor: v}))} />
                    <ColorPicker label="Cor das bordas" value={config.borderColor ?? "#e2e8f0"} onChange={v => setConfig(c => ({...c, borderColor: v}))} />
                    <ColorPicker label="Item ativo" value={config.activeColor ?? "#2563eb"} onChange={v => setConfig(c => ({...c, activeColor: v}))} />
                    <ColorPicker label="Cor secundária" value={config.secondaryColor ?? "#f1f5f9"} onChange={v => setConfig(c => ({...c, secondaryColor: v}))} />
                  </div>
                  {msg && <p className={cn("text-xs", msg.includes("!") ? "text-green-600" : "text-danger")}>{msg}</p>}
                  <button onClick={salvarTema} disabled={carregando}
                    className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark disabled:opacity-50">
                    {carregando ? "Salvando…" : "Aplicar tema"}
                  </button>
                </div>
              </SubPainel>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ nome, fotoUrl, size }: { nome: string; fotoUrl: string | null; size: number }) {
  const cores = ["bg-blue-500","bg-green-500","bg-purple-500","bg-amber-500","bg-red-500","bg-teal-500"];
  const cor = cores[nome.charCodeAt(0) % cores.length];
  if (fotoUrl) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={fotoUrl} alt={nome} className="shrink-0 rounded-full object-cover" style={{width:size,height:size}} />
  );
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", cor)}
      style={{width:size,height:size,fontSize:size*0.38}}>
      {nome.split(" ").filter(Boolean).slice(0,2).map(p=>p[0].toUpperCase()).join("")}
    </span>
  );
}

function SubPainel({ titulo, onVoltar, children }: { titulo: string; onVoltar: () => void; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <button onClick={onVoltar} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar
      </button>
      <p className="mb-4 font-semibold text-slate-900 dark:text-white">{titulo}</p>
      {children}
    </div>
  );
}

function CampoSenha({ label, value, onChange, visivel, setVisivel }:
  { label: string; value: string; onChange: (v: string) => void; visivel: boolean; setVisivel: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input type={visivel ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        <button type="button" onClick={() => setVisivel(!visivel)} tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          {visivel
            ? <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            : <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /></svg>
          }
        </button>
      </div>
    </div>
  );
}
