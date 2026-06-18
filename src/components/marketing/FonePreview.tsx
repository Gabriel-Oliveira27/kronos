// Mockup CSS de celular mostrando o Kronos app — usado na hero da landing page.
// O gradiente da esquerda cria o "sombreamento" pedido, fundindo o mockup
// com o fundo escuro da seção.

const DIAS_MOCK = [
  { rotulo: "SEG", tipo: "PLANTAO", cor: "bg-brand-blue" },
  { rotulo: "TER", tipo: "NORMAL", cor: "bg-slate-700" },
  { rotulo: "QUA", tipo: "HOME_OFFICE", cor: "bg-brand-green" },
  { rotulo: "QUI", tipo: "NORMAL", cor: "bg-slate-700", hoje: true },
  { rotulo: "SEX", tipo: "PLANTAO", cor: "bg-brand-blue" },
  { rotulo: "SÁB", tipo: "SABADO_REDUZIDO", cor: "bg-slate-600" },
  { rotulo: "DOM", tipo: "FOLGA", cor: "bg-amber-500" },
];

export function FonePreview() {
  return (
    <div className="relative flex justify-center lg:justify-end">
      {/* Gradiente de sombreamento — funde o celular com o fundo escuro */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
        style={{
          background: "linear-gradient(to right, #0B1220 0%, transparent 100%)",
        }}
      />
      {/* Gradiente superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16"
        style={{
          background: "linear-gradient(to bottom, #0B1220 0%, transparent 100%)",
        }}
      />

      {/* Corpo do celular */}
      <div className="relative w-[264px] overflow-hidden rounded-[2.75rem] border border-slate-800 bg-slate-950 shadow-2xl shadow-brand-blue/25 ring-1 ring-inset ring-white/[0.06]">
        {/* Dynamic island */}
        <div className="flex h-9 items-center justify-center bg-slate-950">
          <div className="h-[22px] w-[96px] rounded-full bg-black" />
        </div>

        {/* Tela */}
        <div className="min-h-[520px] bg-[#0B1220] px-4 pb-4">
          {/* Topbar do app */}
          <div className="flex items-center justify-between pb-3 pt-1">
            <div className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Kronos" className="h-5 w-5 rounded-[4px]" />
              <span
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "var(--font-display, sans-serif)" }}
              >
                Kronos
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              <span className="text-[10px] text-slate-500">online</span>
            </div>
          </div>

          {/* Saudação */}
          <p className="text-[11px] text-slate-500">Olá, João 👋</p>
          <p
            className="mt-0.5 text-[15px] font-semibold text-white"
            style={{ fontFamily: "var(--font-display, sans-serif)" }}
          >
            Sua semana
          </p>

          {/* Faixa de dias */}
          <div className="mt-3 flex gap-1.5">
            {DIAS_MOCK.map((dia) => (
              <div key={dia.rotulo} className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-medium tracking-wider text-slate-600">
                  {dia.rotulo}
                </span>
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-xl text-[9px] font-semibold text-white ${dia.cor}`}
                >
                  {dia.hoje && (
                    <span className="absolute -inset-0.5 rounded-xl ring-2 ring-white/40" />
                  )}
                  {dia.hoje ? "hj" : ""}
                </div>
              </div>
            ))}
          </div>

          {/* Card próximo plantão */}
          <div className="mt-4 rounded-2xl border border-brand-blue/20 bg-brand-blue/10 px-3 py-3">
            <p className="text-[9px] font-medium uppercase tracking-wider text-brand-blue/60">
              Próximo plantão
            </p>
            <p
              className="mt-0.5 text-sm font-semibold text-white"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              Seg, 23/06
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">Meta: 7h30 (plantão)</p>
          </div>

          {/* Card batidas de hoje */}
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3">
            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
              Ponto de hoje
            </p>
            <div className="mt-2 flex gap-2">
              {["08:02", "12:01", "13:03", "—"].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div
                    className={`flex h-7 w-10 items-center justify-center rounded-lg text-[10px] font-medium ${
                      h === "—"
                        ? "border border-dashed border-slate-700 text-slate-600"
                        : "bg-slate-800 text-white"
                    }`}
                    style={{ fontFamily: "var(--font-mono, monospace)" }}
                  >
                    {h}
                  </div>
                  <span className="text-[8px] text-slate-600">
                    {["Ent.", "Saí.", "Ret.", "Saí."][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Botão bater ponto */}
          <button className="mt-4 w-full rounded-2xl bg-brand-blue py-3 text-center text-[13px] font-semibold text-white shadow-lg shadow-brand-blue/30">
            Bater ponto
          </button>

          {/* Navegação inferior simulada */}
          <div className="mt-5 flex items-center justify-around border-t border-slate-800/60 pt-3">
            {["Início", "Escala", "Ponto", "Base"].map((item, i) => (
              <div key={item} className="flex flex-col items-center gap-0.5">
                <div
                  className={`h-4 w-4 rounded-sm ${i === 0 ? "bg-brand-blue" : "bg-slate-700"}`}
                />
                <span className={`text-[8px] ${i === 0 ? "text-brand-blue" : "text-slate-600"}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicador home */}
        <div className="flex h-7 items-center justify-center bg-[#0B1220]">
          <div className="h-[3px] w-24 rounded-full bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
