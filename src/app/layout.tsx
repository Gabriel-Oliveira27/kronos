import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { usuarioAtual } from "@/lib/session";
import { escurecerHex } from "@/lib/utils";
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

// Roda antes da hidratação para decidir claro/escuro quando a preferência é
// "sistema" (ou para visitantes deslogados) sem dar flash de tema errado.
// Quando o usuário tem preferência explícita (light/dark), o servidor já
// resolve a classe direto na tag <html> — esse script nem entra em ação.
const SCRIPT_TEMA_SISTEMA = `
(function () {
  try {
    var explicito = document.documentElement.dataset.temaExplicito === "1";
    if (explicito) return;
    var escuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", escuro);
  } catch (_) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  const temaBase = usuario?.temaBase ?? "system";
  const temaExplicito = temaBase === "light" || temaBase === "dark";

  const estiloAccent: Record<string, string> = {};
  if (usuario?.corDestaque) {
    estiloAccent["--accent-override"] = usuario.corDestaque;
    estiloAccent["--accent-override-dark"] = escurecerHex(usuario.corDestaque);
  }

  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable} ${
        temaBase === "dark" ? "dark" : ""
      }`}
      data-tema-explicito={temaExplicito ? "1" : "0"}
      style={estiloAccent as React.CSSProperties}
    >
      <head>
        {!temaExplicito && <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_SISTEMA }} />}
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
