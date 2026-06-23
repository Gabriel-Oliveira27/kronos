import { usuarioAtual } from "@/lib/session";
import { Card } from "@/components/ui/Card";

export default async function KronosAppPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  const temSync = usuario.temApp;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-brand-blue">
            <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kronos App
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Aplicativo mobile para registro de ponto em campo.
        </p>
      </div>

      {temSync && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <p className="font-semibold">Sincronização ativa detectada</p>
          <p className="mt-1">Detectamos sincronização ativa com o Kronos App. Recomendamos utilizar as batidas registradas pelo aplicativo.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-brand-blue">
              <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Download do aplicativo</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Disponível para Android e iOS. Bata o ponto de qualquer lugar com sincronização automática.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href="#" className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.87M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z"/>
              </svg>
              App Store
            </a>
            <a href="#" className="flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="m3.609 1.814 10.086 10.043L3.61 21.9A.996.996 0 0 1 3 21V3a1 1 0 0 1 .609-.186ZM5.87 3.18l9.065 9.06-1.962 1.948L5.87 3.18Zm9.065 10.56 1.962 1.947-9.065 9.06L14.935 13.74ZM20.12 10.74a1 1 0 0 1 0 2.52l-2.263 1.267-2.152-2.148 2.152-2.146 2.263 1.507Z"/>
              </svg>
              Google Play
            </a>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="font-semibold text-slate-900 dark:text-white">Como funciona</p>
          {[
            { n:"1", t:"Faça login com suas credenciais do Kronos" },
            { n:"2", t:"Bata o ponto com um toque na tela" },
            { n:"3", t:"As batidas sincronizam automaticamente com o sistema" },
            { n:"4", t:"Consulte seu histórico no Meu Ponto" },
          ].map(({ n, t }) => (
            <div key={n} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-semibold text-brand-blue">{n}</span>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
