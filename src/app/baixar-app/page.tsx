import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const metadata: Metadata = {
  title: "Baixe o Kronos App — Kronos",
  description: "Baixe o aplicativo Kronos para Android e registre seu ponto de qualquer lugar, com sincronização automática.",
};

const PASSOS_INSTALACAO = [
  { n: "1", texto: "Baixe o APK no botão acima." },
  { n: "2", texto: "Abra o arquivo e permita a instalação de fontes desconhecidas, se o Android pedir." },
  { n: "3", texto: "Abra o app, faça login com seu usuário do Kronos e pronto — o ponto sincroniza sozinho." },
];

export default function BaixarAppPage() {
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
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        {/* Hero do app */}
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-blue/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-blue">
              <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Leve o Kronos no bolso.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Bata o ponto de qualquer lugar, acompanhe sua escala da semana e deixe a sincronização
            acontecer sozinha — até sem internet, o app guarda tudo e envia depois.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="/kronos.apk"
              download
              className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dark"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Baixar APK (Android)
            </a>
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Distribuição direta, fora da Play Store.
          </p>
        </div>

        {/* Já tem acesso? */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Já tem seu acesso?
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              O app usa o mesmo usuário e senha do painel web.
            </p>
          </div>
          <div className="grid divide-y divide-slate-200 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col items-start gap-3 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-blue/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-brand-blue">
                  <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Sim, já tenho</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Faça login e siga direto para o seu painel — o app aceita o mesmo acesso.
                </p>
              </div>
              <Link href="/login" className="mt-auto">
                <Button size="sm">Fazer login</Button>
              </Link>
            </div>
            <div className="flex flex-col items-start gap-3 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-green/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-brand-green">
                  <path d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Ainda não tenho</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Solicite seu acesso agora — um administrador cria sua conta e você já entra no app.
                </p>
              </div>
              <Link href="/solicitar-acesso" className="mt-auto">
                <Button size="sm" variant="outline">Solicitar acesso</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Como instalar */}
        <div className="mt-10">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Como instalar</h3>
          <div className="mt-4 flex flex-col gap-3">
            {PASSOS_INSTALACAO.map((p) => (
              <div key={p.n} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-blue font-display text-xs font-semibold text-white">
                  {p.n}
                </span>
                <p className="pt-1 text-sm text-slate-600 dark:text-slate-400">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
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
