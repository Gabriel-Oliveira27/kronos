import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { solicitacaoAcessoSchema } from "@/lib/validations";
import { registrarEvento } from "@/lib/log";
import { comTratamentoDeErro } from "@/lib/api";

// Rota pública — qualquer pessoa pode solicitar acesso, sem autenticação.
export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const corpo = await request.json();
  const dados = solicitacaoAcessoSchema.parse(corpo);

  const solicitacao = await prisma.solicitacaoAcesso.create({
    data: {
      nomeCompleto: dados.nomeCompleto,
      setor: dados.setor,
      email: dados.email || null,
      observacoes: dados.observacoes || null,
    },
  });

  await registrarEvento({
    tipo: "SOLICITACAO_CRIADA",
    detalhe: { solicitacaoId: solicitacao.id, nomeCompleto: solicitacao.nomeCompleto },
  });

  return NextResponse.json(
    { id: solicitacao.id, status: solicitacao.status },
    { status: 201 }
  );
});
