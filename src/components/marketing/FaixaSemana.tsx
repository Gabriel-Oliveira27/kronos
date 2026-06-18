const DIAS = [
  { rotulo: "SEG", tipo: "PLANTAO", hoje: false },
  { rotulo: "TER", tipo: "NORMAL", hoje: false },
  { rotulo: "QUA", tipo: "HOME_OFFICE", hoje: false },
  { rotulo: "QUI", tipo: "NORMAL", hoje: true },
  { rotulo: "SEX", tipo: "PLANTAO", hoje: false },
  { rotulo: "SÁB", tipo: "SABADO_REDUZIDO", hoje: false },
  { rotulo: "DOM", tipo: "FOLGA", hoje: false },
] as const;

const CORES: Record<string, string> = {
  NORMAL: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  PLANTAO: "bg-brand-blue text-white",
  HOME_OFFICE: "bg-brand-green text-white",
  FOLGA: "bg-amber-400 text-amber-950",
  SABADO_REDUZIDO: "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
};

export function FaixaSemana() {
  return (
    <div className="flex gap-2 sm:gap-3">
      {DIAS.map((dia) => (
        <div key={dia.rotulo} className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] font-medium tracking-wider text-slate-400 dark:text-slate-500">
            {dia.rotulo}
          </span>
          <div className="relative">
            {dia.hoje && (
              <span className="absolute -inset-1 animate-pulse rounded-xl bg-brand-blue/30" />
            )}
            <div
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl font-display text-xs font-semibold sm:h-14 sm:w-14 ${CORES[dia.tipo]}`}
            >
              {dia.hoje ? "hoje" : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
