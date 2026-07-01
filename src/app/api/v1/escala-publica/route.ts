import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { verificarSenha } from "@/lib/auth";
import { registrarEvento } from "@/lib/log";
import { contarEventos, obterIp } from "@/lib/ratelimit";

// Rate limit: até 15 tentativas erradas por IP a cada 15 minutos.
const JANELA_MS = 15 * 60 * 1000;
const MAX_FALHAS = 15;

/** Comparação em tempo constante (evita vazar a palavra secreta por timing). */
function comparaSegura(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, ba); // gasta tempo equivalente; não vaza o tamanho
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const palavraSecreta = searchParams.get("ps") ?? "";
  const mes = searchParams.get("mes") ?? "";
  const ip = obterIp(request);

  const palavraGlobal = process.env.PALAVRA_SECRETA_ESCALA ?? "";
  const setoresComPalavra = await prisma.setor.findMany({
    where: { palavraSecretaHash: { not: null } },
    select: { nome: true, palavraSecretaHash: true },
  });

  if (!palavraGlobal && setoresComPalavra.length === 0) {
    return NextResponse.json(
      { error: "Escala pública não configurada. Um configurador precisa definir a palavra secreta do setor.", code: "NAO_CONFIGURADO" },
      { status: 503 }
    );
  }

  // Trava de brute-force da palavra secreta por IP.
  if ((await contarEventos("ESCALA_PUBLICA_FALHA", "ip", ip, JANELA_MS)) >= MAX_FALHAS) {
    await registrarEvento({ tipo: "ESCALA_PUBLICA_BLOQUEADA", detalhe: { ip } });
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde.", code: "MUITAS_TENTATIVAS" }, { status: 429 });
  }

  // Resolve a palavra: primeiro contra o env global (mostra todos os setores),
  // depois contra a palavra secreta de cada setor (mostra só aquele setor).
  let setorFiltro: string | null = null;
  let autorizado = !!palavraGlobal && comparaSegura(palavraSecreta, palavraGlobal);
  if (!autorizado && palavraSecreta) {
    for (const s of setoresComPalavra) {
      if (s.palavraSecretaHash && (await verificarSenha(palavraSecreta, s.palavraSecretaHash))) {
        autorizado = true;
        setorFiltro = s.nome;
        break;
      }
    }
  }

  if (!autorizado) {
    await registrarEvento({ tipo: "ESCALA_PUBLICA_FALHA", detalhe: { ip } });
    return NextResponse.json({ error: "Palavra secreta incorreta.", code: "PALAVRA_INCORRETA" }, { status: 401 });
  }

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: "Informe o mês no formato yyyy-mm.", code: "MES_INVALIDO" }, { status: 400 });
  }

  const [ano, numeroMes] = mes.split("-").map(Number);

  // ─── FIX TIMEZONE ──────────────────────────────────────────────────────
  // new Date(ano, mes-1, 1) usa hora LOCAL — no Brasil (UTC-3) cria 03:00Z
  // em vez de 00:00Z, excluindo registros salvos em UTC midnight.
  const mesStr = String(numeroMes).padStart(2, "0");
  const ultimoDia = new Date(ano, numeroMes, 0).getDate();
  const ultimoDiaStr = String(ultimoDia).padStart(2, "0");
  const inicio = new Date(`${ano}-${mesStr}-01T00:00:00.000Z`);
  const fim = new Date(`${ano}-${mesStr}-${ultimoDiaStr}T23:59:59.999Z`);
  // ───────────────────────────────────────────────────────────────────────

  const [escalas, usuarios] = await Promise.all([
    prisma.escalaDia.findMany({
      where: {
        data: { gte: inicio, lte: fim },
        ...(setorFiltro ? { usuario: { setor: setorFiltro } } : {}),
      },
      orderBy: { data: "asc" },
      select: {
        id: true,
        usuarioId: true,
        data: true,
        tipo: true,
        observacao: true,
        usuario: { select: { id: true, nomeCompleto: true, setor: true, fotoUrl: true } },
      },
    }),
    prisma.usuario.findMany({
      where: setorFiltro ? { setor: setorFiltro } : {},
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, nomeCompleto: true, setor: true, fotoUrl: true },
    }),
  ]);

  return NextResponse.json({ mes, setor: setorFiltro, escalas, usuarios });
}
