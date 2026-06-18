import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/marketing/LoginForm";

export const metadata: Metadata = { title: "Entrar — Kronos" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectPara = params.redirect?.startsWith("/") ? params.redirect : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-6 py-12 dark:bg-bg-dark">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Entrar</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Use o usuário e senha criados pelo administrador.
          </p>
          <div className="mt-6">
            <LoginForm redirectPara={redirectPara} />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Ainda não tem acesso?{" "}
          <Link href="/solicitar-acesso" className="font-medium text-brand-blue hover:underline">
            Solicitar acesso
          </Link>
        </p>
      </div>
    </div>
  );
}
