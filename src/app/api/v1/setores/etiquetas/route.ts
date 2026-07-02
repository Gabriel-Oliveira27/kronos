import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/rbac";
import { etiquetasSetorSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

/**
 * POST — salva as etiquetas de escala de um setor (nome/cor/tipo base).
 * - CONFIGURADOR_ESCALA: só pode editar as etiquetas dos setores a que
 *   pertence. Se o Setor ainda não tem registro, é criado na hora.
 * - ADMIN: qualquer setor.
 */
export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirUsuario();
  if (usuario.papel !== "CONFIGURADOR_ESCALA" && usuario.papel !== "ADMIN") {
    throw ApiError.semPermissao("Apenas o configurador de escala ou um administrador pode editar etiquetas.");
  }

  const { setorNome, etiquetas } = etiquetasSetorSchema.parse(await request.json());

  if (usuario.papel !== "ADMIN") {
    const meusSetores = usuario.setores.length > 0 ? usuario.setores : [usuario.setor];
    if (!meusSetores.includes(setorNome)) {
      throw ApiError.semPermissao("Você só pode editar as etiquetas do seu próprio setor.");
    }
  }

  const ids = etiquetas.map((e) => e.id);
  if (new Set(ids).size !== ids.length) {
    throw new ApiError(400, "Há etiquetas com id duplicado.", "ETIQUETA_DUPLICADA");
  }

  const setor =
    (await prisma.setor.findUnique({ where: { nome: setorNome } })) ??
    (await prisma.setor.create({ data: { nome: setorNome } }));

  await prisma.setor.update({
    where: { id: setor.id },
    data: { etiquetas: JSON.parse(JSON.stringify(etiquetas)) },
  });

  await registrarEvento({
    tipo: "SETOR_EDITADO",
    usuarioId: usuario.id,
    detalhe: {
      setorId: setor.id,
      setor: setorNome,
      acao: "etiquetas",
      quantidade: etiquetas.length,
      antes: setor.etiquetas ?? "(padrão)",
      depois: etiquetas,
    },
  });

  return NextResponse.json({ ok: true, setor: setorNome, etiquetas });
});
