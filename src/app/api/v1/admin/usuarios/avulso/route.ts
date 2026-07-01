import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { hashSenha } from "@/lib/auth";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { z } from "zod";
import { randomBytes } from "node:crypto";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  setor: z.string().trim().min(1).default("Suporte"),
});

/**
 * Cria um "membro avulso" da escala — uma pessoa cadastrada só pelo nome,
 * sem senha real e sem acesso ao app ou à web. Usada pelo configurador de
 * escala para incluir membros da equipe que não precisam de login.
 *
 * Na prática, é um Usuario normal com:
 *   - username gerado automaticamente (avulso_<hex8>)
 *   - senhaHash de uma string aleatória nunca revelada (impossível logar)
 *   - temApp: false
 *   - papel: USUARIO
 *
 * Isso mantém o schema intacto (EscalaDia.usuarioId continua uma FK válida)
 * e permite que futuramente o admin "promova" esse membro a usuário completo
 * editando seu username e senha via PUT /api/v1/admin/usuarios/[id].
 */
export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const criador = await exigirPapel("CONFIGURADOR_ESCALA", "ADMIN");

  const corpo = await request.json();
  const { nome, setor: setorInformado } = schema.parse(corpo);

  // O configurador de escala só monta a escala do próprio setor, então o avulso
  // que ele cria herda o setor dele (evita confusão). O admin pode informar.
  const setor = criador.papel === "ADMIN" ? setorInformado : criador.setor;

  // Gera username único e seguro (sem colisão por aleatoriedade)
  const sufixo = randomBytes(4).toString("hex");
  const username = `avulso_${sufixo}`;

  // Gera uma senha aleatória que nunca é revelada ao usuário —
  // ele literalmente não tem como descobrir para logar
  const senhaAleatoria = randomBytes(32).toString("hex");
  const senhaHash = await hashSenha(senhaAleatoria);

  // Garante que não existe colisão (extremamente improvável, mas defensivo)
  const conflito = await prisma.usuario.findUnique({ where: { username } });
  if (conflito) throw new ApiError(409, "Colisão de username. Tente novamente.", "USERNAME_COLISAO");

  const usuario = await prisma.usuario.create({
    data: {
      nomeCompleto: nome,
      setor,
      username,
      senhaHash,
      papel: "USUARIO",
      temApp: false,
      ehGhost: true,
      origem: "escala",
    },
    select: {
      id: true,
      nomeCompleto: true,
      setor: true,
      username: true,
      papel: true,
      temApp: true,
      ehGhost: true,
      criadoEm: true,
    },
  });

  await prisma.logEvento.create({
    data: {
      tipo: "ACESSO_CRIADO",
      usuarioId: criador.id,
      detalhe: { tipo: "avulso", usuarioCriadoId: usuario.id, nome },
    },
  });

  return NextResponse.json(usuario, { status: 201 });
});
