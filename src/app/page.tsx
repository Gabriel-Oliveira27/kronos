import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HeroMockup } from "@/components/marketing/HeroMockup";
import { CalculadoraHoras } from "@/components/marketing/CalculadoraHoras";

// Ícones simples e discretos para as características do produto (hero).
const iconeRecurso = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-brand-blue">
    <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CARACTERISTICAS = [
  { titulo: "Escalas sincronizadas", icone: iconeRecurso("M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5m9-1.5 1.5 1.5 3-3") },
  { titulo: "Controle de permissões", icone: iconeRecurso("M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z") },
  { titulo: "Histórico de alterações", icone: iconeRecurso("M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z") },
  { titulo: "Aplicativo integrado", icone: iconeRecurso("M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3") },
];

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
            <span className="hidden sm:inline">
              <CalculadoraHoras />
            </span>
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
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              <span className="text-xs font-medium text-brand-blue">
                Controle de ponto e escalas em um só lugar
              </span>
            </div>

            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Organize a jornada da sua equipe sem complicação.
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Gerencie escalas, usuários e registros de ponto em um único painel. Tudo sincronizado
              com o aplicativo utilizado pelos colaboradores.
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

            {/* Características do produto — funcionalidades, não métricas */}
            <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:grid-cols-2">
              {CARACTERISTICAS.map((c) => (
                <div key={c.titulo} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-blue/10">{c.icone}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.titulo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Foto com o app na tela */}
          <HeroMockup />
        </section>

        {/* Calculadora de horas */}
        <section className="border-t border-slate-200 dark:border-slate-800/60">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-blue/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-brand-blue">
                  <path d="M9 7.5h6M9 12h6m-6 4.5h3M6.75 3h10.5A2.25 2.25 0 0 1 19.5 5.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25A2.25 2.25 0 0 1 6.75 3Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  Calculadora de horas trabalhadas
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Informe suas batidas e veja o total do dia, ou simule a que horas sair para
                  cumprir a jornada — com sugestões de ajuste na entrada, na saída ou no almoço.
                  Grátis, direto do navegador, sem login.
                </p>
              </div>
            </div>
            <div className="shrink-0" id="calculadora">
              <CalculadoraHoras variante="botao" />
            </div>
          </div>
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
