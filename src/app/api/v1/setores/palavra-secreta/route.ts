import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { palavraSecretaSetorSchema } from "@/lib/validations";
import { hashSenha } from "@/lib/auth";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

/**
 * POST — define/atualiza a palavra secreta da escala pública de um setor.
 * - CONFIGURADOR_ESCALA: sempre age sobre o PRÓPRIO setor (o setorId do corpo é
 *   ignorado). Se ainda não existir um registro de Setor com o nome do setor
 *   dele, é criado na hora.
 * - ADMIN: usa o `setorId` informado.
 * Palavra vazia limpa a palavra secreta do setor.
 */
export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  if (usuario.papel !== "CONFIGURADOR_ESCALA" && usuario.papel !== "ADMIN") {
    throw ApiError.semPermissao("Apenas o configurador de escala ou um administrador pode definir a palavra secreta.");
  }

  const { setorId, setorNome, palavraSecreta } = palavraSecretaSetorSchema.parse(await request.json());

  // Resolve o setor-alvo conforme o papel.
  let setor;
  if (usuario.papel === "ADMIN") {
    if (!setorId) throw new ApiError(400, "Informe o setor.", "SETOR_OBRIGATORIO");
    setor = await prisma.setor.findUnique({ where: { id: setorId } });
    if (!setor) throw ApiError.naoEncontrado("Setor não encontrado.");
  } else {
    // Configurador: um dos próprios setores (padrão: o principal). Cria o
    // registro do setor na hora se ainda não houver.
    const meusSetores = usuario.setores.length > 0 ? usuario.setores : [usuario.setor];
    const alvo = setorNome ?? usuario.setor;
    if (!meusSetores.includes(alvo)) {
      throw ApiError.semPermissao("Você só pode definir a palavra secreta do seu próprio setor.");
    }
    setor =
      (await prisma.setor.findUnique({ where: { nome: alvo } })) ??
      (await prisma.setor.create({ data: { nome: alvo } }));
  }

  const palavraSecretaHash = palavraSecreta ? await hashSenha(palavraSecreta) : null;
  await prisma.setor.update({ where: { id: setor.id }, data: { palavraSecretaHash } });

  await registrarEvento({
    tipo: "ESCALA_PALAVRA_DEFINIDA",
    usuarioId: usuario.id,
    detalhe: { setorId: setor.id, setor: setor.nome, definida: !!palavraSecreta },
  });

  return NextResponse.json({ ok: true, setor: setor.nome, temPalavra: !!palavraSecreta });
});
