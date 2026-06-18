import { NextResponse } from "next/server";
import { limparCookieSessao, obterClaimsSessao } from "@/lib/session";
import { registrarEvento } from "@/lib/log";
import { comTratamentoDeErro } from "@/lib/api";

export const POST = comTratamentoDeErro(async () => {
  const claims = await obterClaimsSessao();
  await limparCookieSessao();
  if (claims) {
    await registrarEvento({ tipo: "LOGOUT", usuarioId: claims.sub });
  }
  return NextResponse.json({ ok: true });
});
