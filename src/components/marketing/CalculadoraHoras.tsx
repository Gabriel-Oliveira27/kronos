"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

// ── Helpers de tempo ──
function parseHora(hhmm: string): number | null {
  if (!/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}
/** Aceita "8", "8:30" ou "8.5" e devolve minutos. */
function parseDuracao(str: string): number | null {
  const s = str.trim();
  if (!s) return null;
  if (s.includes(":")) {
    const [h, m] = s.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
  const n = Number(s.replace(",", "."));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 60);
}
function fmtDur(min: number): string {
  const s = min < 0 ? "-" : "";
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `${s}${h}h${m ? " " + String(m).padStart(2, "0") + "min" : ""}`;
}
function minParaHHMM(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const CAMPO =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-2 focus:outline-offset-1 focus:outline-brand-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const ROTULO = "mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400";

function SeletorMeta({ metaTexto, setMetaTexto }: { metaTexto: string; setMetaTexto: (v: string) => void }) {
  const presets = ["8:00", "6:00"];
  const ehPreset = presets.includes(metaTexto);
  return (
    <div>
      <label className={ROTULO}>Horas necessárias no dia</label>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => setMetaTexto(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${metaTexto === p ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
            {p === "8:00" ? "8h" : "6h"}
          </button>
        ))}
        <input
          type="text"
          placeholder="Outro (ex.: 7:30)"
          value={ehPreset ? "" : metaTexto}
          onChange={(e) => setMetaTexto(e.target.value)}
          className={`${CAMPO} w-32`}
        />
      </div>
    </div>
  );
}

// ── Modo 1: calcular horas a partir das batidas ──
function ModoCalcular() {
  const [entrada, setEntrada] = useState("");
  const [saidaAlmoco, setSaidaAlmoco] = useState("");
  const [voltaAlmoco, setVoltaAlmoco] = useState("");
  const [saidaFinal, setSaidaFinal] = useState("");
  const [metaTexto, setMetaTexto] = useState("8:00");

  const resultado = useMemo(() => {
    const ent = parseHora(entrada);
    const fim = parseHora(saidaFinal);
    if (ent === null || fim === null) return null;
    const sa = parseHora(saidaAlmoco);
    const va = parseHora(voltaAlmoco);
    let trabalhado: number;
    let almoco = 0;
    if (sa !== null && va !== null) {
      if (sa < ent || va < sa || fim < va) return { erro: "Confira a ordem das batidas." };
      trabalhado = (sa - ent) + (fim - va);
      almoco = va - sa;
    } else {
      if (fim < ent) return { erro: "A saída não pode ser antes da entrada." };
      trabalhado = fim - ent;
    }
    const meta = parseDuracao(metaTexto);
    const dif = meta !== null ? trabalhado - meta : null;
    return { trabalhado, almoco, dif, meta };
  }, [entrada, saidaAlmoco, voltaAlmoco, saidaFinal, metaTexto]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={ROTULO}>Entrada</label><input type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} className={CAMPO} /></div>
        <div><label className={ROTULO}>Saída para o almoço</label><input type="time" value={saidaAlmoco} onChange={(e) => setSaidaAlmoco(e.target.value)} className={CAMPO} /></div>
        <div><label className={ROTULO}>Volta do almoço</label><input type="time" value={voltaAlmoco} onChange={(e) => setVoltaAlmoco(e.target.value)} className={CAMPO} /></div>
        <div><label className={ROTULO}>Saída final</label><input type="time" value={saidaFinal} onChange={(e) => setSaidaFinal(e.target.value)} className={CAMPO} /></div>
      </div>
      <SeletorMeta metaTexto={metaTexto} setMetaTexto={setMetaTexto} />

      {resultado && "erro" in resultado && resultado.erro && (
        <p className="text-sm text-danger">{resultado.erro}</p>
      )}
      {resultado && !("erro" in resultado) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total trabalhado</p>
          <p className="font-display text-3xl font-semibold text-slate-900 dark:text-white">{fmtDur(resultado.trabalhado)}</p>
          {resultado.almoco > 0 && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Almoço: {fmtDur(resultado.almoco)}</p>}
          {resultado.dif !== null && (
            <p className={`mt-2 text-sm font-medium ${resultado.dif === 0 ? "text-brand-green-dark dark:text-brand-green" : resultado.dif < 0 ? "text-danger" : "text-brand-blue"}`}>
              {resultado.dif === 0 ? "Bateu a meta certinho ✓" : resultado.dif < 0 ? `Faltam ${fmtDur(-resultado.dif)}` : `Excedente de ${fmtDur(resultado.dif)}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modo 2: simular batidas ──
function ModoSimular() {
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [metaTexto, setMetaTexto] = useState("8:00");
  const [almocoTexto, setAlmocoTexto] = useState("60");

  const analise = useMemo(() => {
    const ent = parseHora(entrada);
    const meta = parseDuracao(metaTexto);
    const almoco = Number(almocoTexto.replace(",", ".")) || 0;
    if (ent === null || meta === null) return null;

    const saidaSugerida = ent + meta + almoco;
    const base = { saidaSugerida, meta, almoco };

    const fim = parseHora(saida);
    if (fim === null) return { ...base, sugestoes: null as string[] | null };

    const trabalhado = fim - ent - almoco;
    const dif = trabalhado - meta;
    const sugestoes: string[] = [];
    if (dif === 0) {
      sugestoes.push("A entrada e a saída batem exatamente a meta ✓");
    } else if (dif < 0) {
      const falta = -dif;
      sugestoes.push(`Faltam ${fmtDur(falta)} para a meta.`);
      sugestoes.push(`Entrar mais cedo: às ${minParaHHMM(ent - falta)}.`);
      sugestoes.push(`Sair mais tarde: às ${minParaHHMM(fim + falta)}.`);
      if (almoco > 60) {
        const corte = Math.min(falta, almoco - 60);
        sugestoes.push(`Retirar ${fmtDur(corte)} do almoço (de ${fmtDur(almoco)} para ${fmtDur(almoco - corte)}).`);
        if (falta > corte) {
          sugestoes.push(`Ainda faltariam ${fmtDur(falta - corte)} — combine com entrar/sair.`);
        }
      }
    } else {
      sugestoes.push(`Você fará ${fmtDur(dif)} além da meta.`);
      sugestoes.push(`Pode entrar mais tarde: às ${minParaHHMM(ent + dif)}.`);
      sugestoes.push(`Ou sair mais cedo: às ${minParaHHMM(fim - dif)}.`);
    }
    return { ...base, trabalhado, dif, sugestoes };
  }, [entrada, saida, metaTexto, almocoTexto]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={ROTULO}>Entrada</label><input type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} className={CAMPO} /></div>
        <div><label className={ROTULO}>Saída (opcional)</label><input type="time" value={saida} onChange={(e) => setSaida(e.target.value)} className={CAMPO} /></div>
        <div><label className={ROTULO}>Almoço (minutos)</label><input type="number" min={0} value={almocoTexto} onChange={(e) => setAlmocoTexto(e.target.value)} className={CAMPO} /></div>
        <div className="col-span-2"><SeletorMeta metaTexto={metaTexto} setMetaTexto={setMetaTexto} /></div>
      </div>

      {analise && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-sm text-slate-500 dark:text-slate-400">Para cumprir {fmtDur(analise.meta)} com {fmtDur(analise.almoco)} de almoço:</p>
          <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Saia às {minParaHHMM(analise.saidaSugerida)}</p>
          {analise.sugestoes && (
            <ul className="mt-3 flex flex-col gap-1 border-t border-slate-200 pt-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              {analise.sugestoes.map((s, i) => (
                <li key={i} className="flex gap-2"><span className="text-brand-blue">•</span>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function CalculadoraHoras() {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<"calcular" | "simular">("calcular");

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-blue dark:text-slate-400 dark:hover:text-white"
      >
        Calculadora de horas
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAberto(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Calculadora de horas</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Some suas batidas ou simule quando sair para bater a meta.</p>
              </div>
              <button onClick={() => setAberto(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Fechar">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {([["calcular", "Calcular horas"], ["simular", "Simular batidas"]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setAba(id)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${aba === id ? "bg-white text-brand-blue shadow-sm dark:bg-slate-900" : "text-slate-500 dark:text-slate-400"}`}>
                  {label}
                </button>
              ))}
            </div>

            {aba === "calcular" ? <ModoCalcular /> : <ModoSimular />}

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
              <Button variant="ghost" onClick={() => setAberto(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
