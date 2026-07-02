import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CalculadoraTabs } from "@/components/marketing/CalculadoraTabs";

export const metadata: Metadata = {
  title: "Calculadora de horas — Kronos",
  description:
    "Calcule as horas trabalhadas do dia, simule batidas e monte um plano para pagar horas em débito.",
};

export default function CalculadoraPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1220]">
      <header className="border-b border-slate-200 dark:border-slate-800/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/"><Logo withIcon={false} wordmarkClassName="text-2xl text-brand-blue" /></Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Página inicial
            </Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              Entrar
            </Link>
            <Link href="/solicitar-acesso"><Button size="sm">Solicitar acesso</Button></Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-brand-blue">
              <path d="M9 7.5h6M9 12h6m-6 4.5h3M6.75 3h10.5A2.25 2.25 0 0 1 19.5 5.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25A2.25 2.25 0 0 1 6.75 3Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-medium text-brand-blue">Ferramenta gratuita</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Calculadora de horas
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Some as batidas do dia, descubra a que horas sair para bater a meta ou monte um plano
            para quitar horas em débito — tudo direto do navegador, sem login.
          </p>
        </div>

        <CalculadoraTabs />
      </main>

      <footer className="border-t border-slate-200 px-6 py-8 dark:border-slate-800/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo size={22} />
          <p className="text-xs text-slate-500 dark:text-slate-600">© {new Date().getFullYear()} Kronos</p>
        </div>
      </footer>
    </div>
  );
}
