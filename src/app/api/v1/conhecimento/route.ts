import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { conhecimentoItemSchema } from "@/lib/validations";
import { comTratamentoDeErro } from "@/lib/api";
import type { Prisma } from "@prisma/client";

// Regra de visibilidade (validada com dados reais durante o desenvolvimento):
// PUBLICO aparece para todo mundo; PRIVADO só para o autor — exceto para
// ADMIN/SUPORTE, que veem privados de qualquer um (auditoria, intencional).
export const GET = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const categoria = searchParams.get("categoria")?.trim();

  const podeVerTudo = usuario.papel === "ADMIN" || usuario.papel === "SUPORTE";

  const where: Prisma.ConhecimentoItemWhereInput = {
    deletadoEm: null,
    ...(podeVerTudo ? {} : { OR: [{ visibilidade: "PUBLICO" }, { autorId: usuario.id }] }),
    ...(categoria ? { categoria } : {}),
    ...(q
      ? {
          OR: [
            { titulo: { contains: q, mode: "insensitive" } },
            { conteudo: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const itens = await prisma.conhecimentoItem.findMany({
    where,
    orderBy: { atualizadoEm: "desc" },
    include: { autor: { select: { id: true, nomeCompleto: true } } },
  });

  return NextResponse.json(itens);
});

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const corpo = await request.json();
  const dados = conhecimentoItemSchema.parse(corpo);

  const item = await prisma.conhecimentoItem.create({
    data: {
      autorId: usuario.id,
      titulo: dados.titulo,
      conteudo: dados.conteudo,
      categoria: dados.categoria || null,
      tags: dados.tags,
      visibilidade: dados.visibilidade,
    },
  });

  return NextResponse.json(item, { status: 201 });
});
