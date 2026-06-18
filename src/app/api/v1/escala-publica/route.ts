import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota pública — NÃO exige sessão de usuário. A proteção é a palavra secreta
// comparada contra a variável de ambiente PALAVRA_SECRETA_ESCALA.
// Como qualquer coisa protegida só por senha, não é segurança de banco —
// é apenas uma barreira para não expor a escala ao público geral da internet.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const palavraSecreta = searchParams.get("ps") ?? "";
  const mes = searchParams.get("mes") ?? ""; // yyyy-mm

  const palavraCorreta = process.env.PALAVRA_SECRETA_ESCALA ?? "";

  if (!palavraCorreta) {
    return NextResponse.json(
      { error: "Escala pública não configurada. Defina PALAVRA_SECRETA_ESCALA no servidor.", code: "NAO_CONFIGURADO" },
      { status: 503 }
    );
  }

  // Comparação de tempo constante para evitar timing attacks básicos
  if (palavraSecreta.length !== palavraCorreta.length || palavraSecreta !== palavraCorreta) {
    return NextResponse.json(
      { error: "Palavra secreta incorreta.", code: "PALAVRA_INCORRETA" },
      { status: 401 }
    );
  }

  // Valida o formato do mês
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json(
      { error: "Informe o mês no formato yyyy-mm.", code: "MES_INVALIDO" },
      { status: 400 }
    );
  }

  const [ano, numeroMes] = mes.split("-").map(Number);
  const inicio = new Date(ano, numeroMes - 1, 1);
  const fim = new Date(ano, numeroMes, 0, 23, 59, 59, 999); // último dia do mês

  const [escalas, usuarios] = await Promise.all([
    prisma.escalaDia.findMany({
      where: { data: { gte: inicio, lte: fim } },
      orderBy: { data: "asc" },
      select: {
        id: true,
        usuarioId: true,
        data: true,
        tipo: true,
        observacao: true,
        usuario: { select: { id: true, nomeCompleto: true, setor: true } },
      },
    }),
    prisma.usuario.findMany({
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, nomeCompleto: true, setor: true },
    }),
  ]);

  return NextResponse.json({ mes, escalas, usuarios });
}
