import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { usuarioAtual } from "@/lib/session";
import { escurecerHex, cn } from "@/lib/utils";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kronos — controle de ponto e escalas",
  description: "Gestão de usuários, escalas de trabalho e base de conhecimento da equipe.",
};

// Minificado propositalmente — menor payload e evita quebra de linha
// que o React 19 interpreta como whitespace em scripts inline.
const SCRIPT_TEMA = `(function(){try{var e=document.documentElement.dataset.temaExplicito==="1";if(e)return;var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(_){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  const temaBase = usuario?.temaBase ?? "system";
  const temaExplicito = temaBase === "light" || temaBase === "dark";

  // cn() filtra tokens falsy, eliminando o espaço extra quando temaBase ≠ "dark".
  // Esse espaço extra causava o hydration mismatch entre o servidor (string
  // estática) e o cliente (expressão JSX) no Turbopack.
  const htmlClass = cn(
    spaceGrotesk.variable,
    plexSans.variable,
    plexMono.variable,
    temaBase === "dark" && "dark"
  );

  // Passa undefined em vez de {} quando não há cor — {} serializa de forma
  // diferente entre servidor e cliente, causando outro mismatch.
  const style = usuario?.corDestaque
    ? ({
        "--accent-override": usuario.corDestaque,
        "--accent-override-dark": escurecerHex(usuario.corDestaque),
      } as React.CSSProperties)
    : undefined;

  return (
    <html
      lang="pt-BR"
      className={htmlClass}
      data-tema-explicito={temaExplicito ? "1" : "0"}
      style={style}
      // suppressHydrationWarning: cobre o caso residual do Turbopack (Next 16)
      // em que o formato do atributo className difere levemente entre RSC e
      // hidratação do cliente mesmo com cn(). Não oculta erros reais de conteúdo.
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {children}
        {/*
          Script de detecção de tema do sistema roda ANTES da hidratação via
          strategy="beforeInteractive". Colocado no <body> (não no <head>) porque
          o React 19 emite warning ao encontrar <script> dentro de <head> JSX —
          o Next.js injeta corretamente no <head> da resposta HTML de qualquer jeito.
        */}
        {!temaExplicito && (
          <Script
            id="kronos-tema-init"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }}
          />
        )}
      </body>
    </html>
  );
}
