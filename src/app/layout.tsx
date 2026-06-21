import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
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
      // suppressHydrationWarning: cobre o mismatch residual do Turbopack (Next 16)
      // no formato do className entre RSC e hidratação do cliente.
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {children}
        {/*
          NOTA: O script de detecção de tema do sistema foi removido daqui.
          React 19 emite warning ("Encountered a script tag while rendering
          React component") para qualquer <script> em JSX, incluindo o
          componente Script do next/script com strategy="beforeInteractive".

          A detecção de preferência do sistema agora acontece client-side
          via useEffect no ThemeToggle — sem flash perceptível para usuários
          logados (tema explícito já vem do servidor) e mínimo para o sistema.
        */}
      </body>
    </html>
  );
}
