"use client";

import { useEffect, useMemo, useState } from "react";
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
  if (h === 0) return `${s}${m}min`;
  return `${s}${h}h${m ? String(m).padStart(2, "0") : ""}`;
}
function minParaHHMM(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const CAMPO =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:outline-2 focus:outline-offset-1 focus:outline-brand-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const ROTULO = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function SeletorMeta({ metaTexto, setMetaTexto }: { metaTexto: string; setMetaTexto: (v: string) => void }) {
  const presets = ["8:00", "6:00"];
  const ehPreset = presets.includes(metaTexto);
  return (
    <div>
      <label className={ROTULO}>Horas necessárias no dia</label>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => setMetaTexto(p)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${metaTexto === p ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
            {p === "8:00" ? "8h" : "6h"}
          </button>
        ))}
        <input
          type="text"
          placeholder="Outro (ex.: 7:30)"
          value={ehPreset ? "" : metaTexto}
          onChange={(e) => setMetaTexto(e.target.value)}
          className={`${CAMPO} h-10 w-36`}
        />
      </div>
    </div>
  );
}

/** Grupo de escolha simples (radio estilizado) para o questionário. */
function Escolha<T extends string>({
  label, valor, onChange, opcoes,
}: {
  label: string;
  valor: T;
  onChange: (v: T) => void;
  opcoes: { valor: T; rotulo: string }[];
}) {
  return (
    <div>
      <label className={ROTULO}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <button key={o.valor} type="button" onClick={() => onChange(o.valor)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              valor === o.valor
                ? "bg-brand-blue text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}>
            {o.rotulo}
          </button>
        ))}
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
        <div className="rounded-xl border-2 border-brand-blue/30 bg-brand-blue/5 p-4 dark:bg-brand-blue/10">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total trabalhado</p>
          <p className="font-display text-4xl font-semibold text-slate-900 dark:text-white">{fmtDur(resultado.trabalhado)}</p>
          {resultado.almoco > 0 && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Almoço: {fmtDur(resultado.almoco)}</p>}
          {resultado.dif !== null && (
            <p className={`mt-2 text-base font-semibold ${resultado.dif === 0 ? "text-brand-green-dark dark:text-brand-green" : resultado.dif < 0 ? "text-danger" : "text-brand-blue"}`}>
              {resultado.dif === 0 ? "Meta batida certinho ✓" : resultado.dif < 0 ? `Faltam ${fmtDur(-resultado.dif)} para a meta` : `${fmtDur(resultado.dif)} além da meta`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modo 2: simular batidas ──
type PrefSaida = "mais_cedo" | "mais_tarde" | "tanto_faz";
type PrefAlmoco = "sim" | "nao";

function ModoSimular() {
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [metaTexto, setMetaTexto] = useState("8:00");
  const [almocoTexto, setAlmocoTexto] = useState("60");
  const [prefSaida, setPrefSaida] = useState<PrefSaida>("tanto_faz");
  const [prefAlmoco, setPrefAlmoco] = useState<PrefAlmoco>("nao");

  const analise = useMemo(() => {
    const ent = parseHora(entrada);
    const meta = parseDuracao(metaTexto);
    const almoco = Number(almocoTexto.replace(",", ".")) || 0;
    if (ent === null || meta === null) return null;

    const saidaIdeal = ent + meta + almoco;
    const fim = parseHora(saida);

    // Sem saída informada: só mostra o horário ideal.
    if (fim === null) return { saidaIdeal, meta, almoco, plano: null as null | { principal: string; alternativas: string[]; dif: number } };

    const trabalhado = fim - ent - almoco;
    const dif = trabalhado - meta;

    if (dif === 0) {
      return { saidaIdeal, meta, almoco, plano: { principal: "Sua entrada e saída batem a meta certinho ✓", alternativas: [], dif } };
    }

    const opcoes: { chave: string; texto: string }[] = [];
    if (dif < 0) {
      const falta = -dif;
      // Monta as opções e escolhe a principal conforme as preferências.
      const podeCortarAlmoco = almoco > 60;
      const corte = podeCortarAlmoco ? Math.min(falta, almoco - 60) : 0;

      if (podeCortarAlmoco && prefAlmoco === "sim") {
        if (corte >= falta) {
          opcoes.push({ chave: "almoco", texto: `Reduza o almoço em ${fmtDur(falta)} (fica com ${fmtDur(almoco - falta)}) e mantenha a saída às ${minParaHHMM(fim)}.` });
        } else {
          const resto = falta - corte;
          opcoes.push({
            chave: "almoco+saida",
            texto: prefSaida === "mais_cedo"
              ? `Reduza o almoço para 1h e entre ${fmtDur(resto)} mais cedo (às ${minParaHHMM(ent - resto)}).`
              : `Reduza o almoço para 1h e saia ${fmtDur(resto)} mais tarde (às ${minParaHHMM(fim + resto)}).`,
          });
        }
      }
      if (prefSaida === "mais_cedo") {
        opcoes.push({ chave: "entrada", texto: `Entre ${fmtDur(falta)} mais cedo: às ${minParaHHMM(ent - falta)}.` });
        opcoes.push({ chave: "saida", texto: `Ou saia ${fmtDur(falta)} mais tarde: às ${minParaHHMM(fim + falta)}.` });
      } else {
        opcoes.push({ chave: "saida", texto: `Saia ${fmtDur(falta)} mais tarde: às ${minParaHHMM(fim + falta)}.` });
        opcoes.push({ chave: "entrada", texto: `Ou entre ${fmtDur(falta)} mais cedo: às ${minParaHHMM(ent - falta)}.` });
      }
      if (podeCortarAlmoco && prefAlmoco === "nao") {
        opcoes.push({ chave: "almoco", texto: `Se mudar de ideia: reduzir o almoço em ${fmtDur(corte)} também ajuda.` });
      }

      const [principal, ...alternativas] = opcoes;
      return { saidaIdeal, meta, almoco, plano: { principal: `Faltam ${fmtDur(falta)}. ${principal.texto}`, alternativas: alternativas.map((o) => o.texto), dif } };
    }

    // Excedente
    const sobra = dif;
    const principal = prefSaida === "mais_tarde"
      ? `Você fará ${fmtDur(sobra)} além da meta. Pode entrar mais tarde: às ${minParaHHMM(ent + sobra)}.`
      : `Você fará ${fmtDur(sobra)} além da meta. Pode sair mais cedo: às ${minParaHHMM(fim - sobra)}.`;
    const alternativa = prefSaida === "mais_tarde"
      ? `Ou sair mais cedo: às ${minParaHHMM(fim - sobra)}.`
      : `Ou entrar mais tarde: às ${minParaHHMM(ent + sobra)}.`;
    return { saidaIdeal, meta, almoco, plano: { principal, alternativas: [alternativa], dif } };
  }, [entrada, saida, metaTexto, almocoTexto, prefSaida, prefAlmoco]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={ROTULO}>Entrada</label><input type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} className={CAMPO} /></div>
        <div><label className={ROTULO}>Saída desejada (opcional)</label><input type="time" value={saida} onChange={(e) => setSaida(e.target.value)} className={CAMPO} /></div>
        <div><label className={ROTULO}>Almoço (minutos)</label><input type="number" min={0} value={almocoTexto} onChange={(e) => setAlmocoTexto(e.target.value)} className={CAMPO} /></div>
        <div className="col-span-2"><SeletorMeta metaTexto={metaTexto} setMetaTexto={setMetaTexto} /></div>
      </div>

      {/* Questionário de preferências — direciona a recomendação */}
      <div className="grid gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40 sm:grid-cols-2">
        <Escolha
          label="Prefere ajustar como?"
          valor={prefSaida}
          onChange={setPrefSaida}
          opcoes={[
            { valor: "mais_cedo", rotulo: "Entrar/sair mais cedo" },
            { valor: "mais_tarde", rotulo: "Sair mais tarde" },
            { valor: "tanto_faz", rotulo: "Tanto faz" },
          ]}
        />
        <Escolha
          label="Pode reduzir o almoço?"
          valor={prefAlmoco}
          onChange={setPrefAlmoco}
          opcoes={[
            { valor: "sim", rotulo: "Sim" },
            { valor: "nao", rotulo: "Prefiro não" },
          ]}
        />
      </div>

      {analise && (
        <div className="flex flex-col gap-3">
          {/* Horário ideal — sempre visível e destacado */}
          <div className="rounded-xl border-2 border-brand-blue/30 bg-brand-blue/5 p-4 dark:bg-brand-blue/10">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Para {fmtDur(analise.meta)} de trabalho com {fmtDur(analise.almoco)} de almoço, saia às
            </p>
            <p className="font-display text-4xl font-semibold text-brand-blue">{minParaHHMM(analise.saidaIdeal)}</p>
          </div>

          {/* Recomendação conforme a saída desejada + preferências */}
          {analise.plano && (
            <div className={`rounded-xl border p-4 ${
              analise.plano.dif === 0
                ? "border-brand-green/40 bg-brand-green/5 dark:bg-brand-green/10"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Recomendação</p>
              <p className={`mt-1 text-base font-semibold ${analise.plano.dif === 0 ? "text-brand-green-dark dark:text-brand-green" : "text-slate-900 dark:text-white"}`}>
                {analise.plano.principal}
              </p>
              {analise.plano.alternativas.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-2 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {analise.plano.alternativas.map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-brand-blue">•</span>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CalculadoraHoras({ variante = "link" }: { variante?: "link" | "botao" }) {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<"calcular" | "simular">("calcular");

  // Trava o scroll da página enquanto o modal está aberto.
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, [aberto]);

  return (
    <>
      {variante === "link" ? (
        <button
          onClick={() => setAberto(true)}
          className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-blue dark:text-slate-400 dark:hover:text-white"
        >
          Calculadora de horas
        </button>
      ) : (
        <Button size="lg" onClick={() => setAberto(true)}>
          Abrir calculadora
        </Button>
      )}

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAberto(false)} />
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 p-6 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Calculadora de horas</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Some suas batidas ou simule quando sair para bater a meta.</p>
              </div>
              <button onClick={() => setAberto(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Fechar">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {([["calcular", "Calcular horas"], ["simular", "Simular batidas"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setAba(id)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${aba === id ? "bg-white text-brand-blue shadow-sm dark:bg-slate-900" : "text-slate-500 dark:text-slate-400"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {aba === "calcular" ? <ModoCalcular /> : <ModoSimular />}
            </div>

            <div className="flex justify-end border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="ghost" onClick={() => setAberto(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
