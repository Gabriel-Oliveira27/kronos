import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HeroMockup } from "@/components/marketing/HeroMockup";

const RECURSOS = [
  {
    titulo: "Escalas sem ambiguidade",
    descricao:
      "Plantão, home office, folga ou sábado reduzido — cada colaborador sabe exatamente o que vem a seguir, e o configurador de escala vê a equipe inteira de uma vez.",
  },
  {
    titulo: "Base de conhecimento da equipe",
    descricao:
      "Itens públicos para todo mundo consultar e itens privados para anotações pessoais — com auditoria completa para quem administra.",
  },
  {
    titulo: "Ponto sincronizado com o app",
    descricao:
      "O Kronos web é a central de gestão; o app mobile sincroniza as batidas automaticamente, de forma incremental.",
  },
];

const PASSOS = [
  {
    numero: "1",
    titulo: "Solicite acesso",
    descricao: "Preencha nome e setor. Sem burocracia — o resto é opcional.",
  },
  {
    numero: "2",
    titulo: "Aguarde a aprovação",
    descricao: "Um administrador analisa o pedido e cria seu acesso manualmente.",
  },
  {
    numero: "3",
    titulo: "Entre e comece",
    descricao: "Com usuário e senha em mãos, sua escala e seu painel já estarão prontos.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1220]">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo withIcon={false} wordmarkClassName="text-2xl text-brand-blue" />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/escala"
              className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:inline"
            >
              Ver escala
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Entrar
            </Link>
            <Link href="/solicitar-acesso">
              <Button size="sm">Solicitar acesso</Button>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-10 overflow-hidden px-6 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          {/* Texto */}
          <div>
            {/* Pílula de destaque */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
              <span className="text-xs font-medium text-brand-blue">
                Controle de ponto + escalas em um só lugar
              </span>
            </div>

            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Chega de foto{" "}
              <span className="text-slate-400 dark:text-slate-500">de escala</span>{" "}
              no grupo.
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Gestão de usuários, escalas de trabalho e conhecimento da equipe em um só lugar —
              e a base que sincroniza com o app de ponto de cada colaborador.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/solicitar-acesso">
                <Button size="lg">Solicitar acesso</Button>
              </Link>
              <Link href="/escala">
                <Button size="lg" variant="outline">
                  Ver escala do plantão
                </Button>
              </Link>
            </div>

            {/* Prova social / stats */}
            <div className="mt-10 flex gap-8 border-t border-slate-200 pt-8 dark:border-slate-800">
              <div>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">4</p>
                <p className="text-xs text-slate-500">papéis de acesso</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">100%</p>
                <p className="text-xs text-slate-500">sincronizado com o app</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">24h</p>
                <p className="text-xs text-slate-500">de auditoria de exclusões</p>
              </div>
            </div>
          </div>

          {/* Foto com o app na tela */}
          <HeroMockup />
        </section>

        {/* Recursos */}
        <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              Tudo que a operação precisa, num lugar só
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {RECURSOS.map((r) => (
                <div
                  key={r.titulo}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                >
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{r.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{r.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Como funciona o acesso
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {PASSOS.map((p) => (
              <div key={p.numero}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue font-display text-sm font-semibold text-white">
                  {p.numero}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-slate-900 dark:text-white">{p.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/20">
          <div className="mx-auto max-w-6xl px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              Pronto para organizar a sua equipe?
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Solicite o acesso — um administrador cria sua conta manualmente em seguida.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/solicitar-acesso">
                <Button size="lg">Solicitar acesso</Button>
              </Link>
              <Link href="/escala">
                <Button size="lg" variant="ghost">
                  Ver escala pública →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-6 py-8 dark:border-slate-800/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo size={22} />
          <p className="text-xs text-slate-500 dark:text-slate-600">© {new Date().getFullYear()} Kronos</p>
        </div>
      </footer>
    </div>
  );
}
