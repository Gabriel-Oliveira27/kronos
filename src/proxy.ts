import { NextResponse, type NextRequest } from "next/server";
import { verificarSessao } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";

// proxy.ts é o substituto do middleware.ts a partir do Next.js 16 — roda em
// runtime Node e fica só com tarefas leves de borda (checagem de sessão e
// redirecionamentos). Decisões finas de permissão por papel ficam nas
// páginas/rotas, contra o registro atual do usuário no banco (ver
// src/lib/rbac.ts e src/lib/session.ts).

const ROTAS_AUTENTICADAS = ["/dashboard"];
const ROTAS_SOMENTE_DESLOGADO = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const sessao = await verificarSessao(token);

  const precisaAutenticacao = ROTAS_AUTENTICADAS.some((rota) => pathname.startsWith(rota));
  const somenteDeslogado = ROTAS_SOMENTE_DESLOGADO.some((rota) => pathname.startsWith(rota));

  if (precisaAutenticacao && !sessao) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (somenteDeslogado && sessao) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
