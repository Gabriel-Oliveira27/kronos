import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { atualizarPerfilProprioSchema } from "@/lib/validations";
import { hashSenha, verificarSenha } from "@/lib/auth";
import { comTratamentoDeErro, ApiError } from "@/lib/api";

export const GET = comTratamentoDeErro(async () => {
  const usuario = await exigirUsuario();
  // Inclui o modelo de horário atribuído (nome para a tela de perfil do app;
  // jornadaPlantao para o aviso de semana de plantão — ver docs/kronos-app-semana-plantao.md).
  const modeloHorario = usuario.modeloHorarioId
    ? await prisma.modeloHorario.findUnique({
        where: { id: usuario.modeloHorarioId },
        select: { nome: true, jornadaPlantao: true },
      })
    : null;
  return NextResponse.json({ ...usuario, modeloHorario });
});

export const PATCH = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  const dados = atualizarPerfilProprioSchema.parse(await request.json());

  let novaSenhaHash: string | undefined;
  if (dados.novaSenha) {
    if (!dados.senhaAtual) {
      throw new ApiError(400, "Informe a senha atual para definir uma nova.", "SENHA_ATUAL_OBRIGATORIA");
    }
    const completo = await prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id } });
    const senhaOk = await verificarSenha(dados.senhaAtual, completo.senhaHash);
    if (!senhaOk) {
      throw new ApiError(401, "Senha atual incorreta.", "SENHA_ATUAL_INCORRETA");
    }
    novaSenhaHash = await hashSenha(dados.novaSenha);
  }

  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      ...(dados.temaBase !== undefined ? { temaBase: dados.temaBase } : {}),
      ...(dados.corDestaque !== undefined ? { corDestaque: dados.corDestaque || null } : {}),
      // temaConfig é Json? no Prisma — normaliza para JSON puro antes de gravar.
      ...(dados.temaConfig !== undefined ? { temaConfig: JSON.parse(JSON.stringify(dados.temaConfig)) } : {}),
      ...(dados.fotoUrl !== undefined ? { fotoUrl: dados.fotoUrl || null } : {}),
      ...(novaSenhaHash ? { senhaHash: novaSenhaHash } : {}),
    },
    select: {
      id: true,
      nomeCompleto: true,
      setor: true,
      email: true,
      username: true,
      papel: true,
      temApp: true,
      fotoUrl: true,
      temaBase: true,
      corDestaque: true,
      temaConfig: true,
    },
  });

  return NextResponse.json(atualizado);
});
