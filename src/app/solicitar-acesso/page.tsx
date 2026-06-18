import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { SolicitarAcessoForm } from "@/components/marketing/SolicitarAcessoForm";

export const metadata: Metadata = { title: "Solicitar acesso — Kronos" };

export default function SolicitarAcessoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-6 py-12 dark:bg-bg-dark">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Solicitar acesso ao Kronos
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Conte pra gente quem é você. Um administrador cria seu acesso manualmente em seguida.
          </p>
          <div className="mt-6">
            <SolicitarAcessoForm />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Já tem acesso?{" "}
          <Link href="/login" className="font-medium text-brand-blue hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
