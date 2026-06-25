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
              Disponível para Android (APK). Bata o ponto de qualquer lugar com sincronização automática.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href="/kronos.apk"
              download
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Baixar APK (Android)
            </a>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Distribuição direta (fora da Play Store). Veja como instalar ao lado.
            </p>
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

      {/* Orientações de instalação (APK fora da Play Store) */}
      <Card className="flex flex-col gap-3">
        <p className="font-semibold text-slate-900 dark:text-white">Como instalar no Android</p>
        {[
          { n:"1", t:"Baixe o APK tocando em “Baixar APK (Android)”." },
          { n:"2", t:"Ao abrir o arquivo, o Android pode pedir para permitir a instalação de “fontes desconhecidas” ou “apps externos” — ative essa permissão para o navegador ou gerenciador de arquivos." },
          { n:"3", t:"O Play Protect pode exibir um aviso (“app não reconhecido”). Toque em “Mais detalhes” e depois em “Instalar assim mesmo”." },
          { n:"4", t:"Conclua a instalação e abra o Kronos normalmente." },
        ].map(({ n, t }) => (
          <div key={n} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xs font-semibold text-brand-green-dark dark:text-brand-green">{n}</span>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t}</p>
          </div>
        ))}
        <p className="mt-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Esses avisos são normais em aplicativos distribuídos fora da Google Play e não indicam
          problema. Você precisa fazer isso apenas na primeira instalação; as atualizações seguintes
          são mais simples.
        </p>
      </Card>
    </div>
  );
}
