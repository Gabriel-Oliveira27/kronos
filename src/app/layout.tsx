import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { usuarioAtual } from "@/lib/session";
import { escurecerHex, cn } from "@/lib/utils";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Kronos — controle de ponto e escalas",
  description: "Gestão de usuários, escalas de trabalho e base de conhecimento da equipe.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  const temaBase = usuario?.temaBase ?? "system";

  // Mapeia valores legados (light/dark) para novos nomes
  const temaResolvido = temaBase === "light" ? "claro"
    : temaBase === "dark"   ? "escuro"
    : temaBase === "claro"  ? "claro"
    : temaBase === "escuro" ? "escuro"
    : temaBase === "noturno"? "noturno"
    : null; // system → sem data-tema (ThemeToggle detecta no client)

  const htmlClass = cn(
    spaceGrotesk.variable,
    plexSans.variable,
    plexMono.variable,
    // Classe .dark para retrocompatibilidade com componentes que usam dark:
    (temaResolvido === "escuro" || temaResolvido === "noturno") && "dark",
    temaResolvido === "noturno" && "night",
  );

  // Monta as CSS vars de personalização avançada
  const temaConfig = usuario?.temaConfig as Record<string, string> | null | undefined;
  const styleVars: Record<string, string> = {};
  if (usuario?.corDestaque) {
    styleVars["--accent-override"] = usuario.corDestaque;
    styleVars["--accent-override-dark"] = escurecerHex(usuario.corDestaque);
  }
  if (temaConfig?.textColor)      styleVars["--user-text"]       = temaConfig.textColor;
  if (temaConfig?.borderColor)    styleVars["--user-border"]      = temaConfig.borderColor;
  if (temaConfig?.activeColor)    styleVars["--user-active"]      = temaConfig.activeColor;
  if (temaConfig?.secondaryColor) styleVars["--user-secondary"]   = temaConfig.secondaryColor;

  const style = Object.keys(styleVars).length > 0
    ? (styleVars as React.CSSProperties)
    : undefined;

  return (
    <html
      lang="pt-BR"
      className={htmlClass}
      data-tema={temaResolvido ?? "system"}
      data-tema-explicito={temaResolvido ? "1" : "0"}
      style={style}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
