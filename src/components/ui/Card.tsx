import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

type BadgeTone = "blue" | "green" | "amber" | "red" | "slate";

const TONES: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-brand-blue ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  green:
    "bg-green-50 text-brand-green-dark ring-1 ring-inset ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/30",
  amber:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  red: "bg-red-50 text-danger-dark ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
  slate:
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const TOM_POR_TIPO_ESCALA: Record<string, BadgeTone> = {
  NORMAL: "slate",
  PLANTAO: "blue",
  HOME_OFFICE: "green",
  FOLGA: "amber",
  SABADO_REDUZIDO: "slate",
};

const TOM_POR_PAPEL: Record<string, BadgeTone> = {
  ADMIN: "blue",
  SUPORTE: "amber",
  CONFIGURADOR_ESCALA: "green",
  USUARIO: "slate",
};

export function BadgeTipoEscala({ tipo, rotulo }: { tipo: string; rotulo: string }) {
  return <Badge tone={TOM_POR_TIPO_ESCALA[tipo] ?? "slate"}>{rotulo}</Badge>;
}

export function BadgePapel({ papel, rotulo }: { papel: string; rotulo: string }) {
  return <Badge tone={TOM_POR_PAPEL[papel] ?? "slate"}>{rotulo}</Badge>;
}
