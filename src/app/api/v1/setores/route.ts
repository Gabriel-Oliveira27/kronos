import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario, exigirPapel } from "@/lib/rbac";
import { setorSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

/**
 * GET — lista de setores. Qualquer usuário autenticado pode ler (os seletores
 * de setor do formulário de usuário e da escala dependem disso). `temPalavra`
 * indica se o setor já tem palavra secreta configurada para a escala pública.
 */
export const GET = comTratamentoDeErro(async () => {
  await exigirUsuario();
  const setores = await prisma.setor.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(
    // `etiquetas` vai junto (null = padrão do código) — o app mobile usa para
    // exibir os nomes/cores personalizados da escala do setor.
    setores.map((s) => ({ id: s.id, nome: s.nome, temPalavra: !!s.palavraSecretaHash, etiquetas: s.etiquetas }))
  );
});

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const admin = await exigirPapel("ADMIN");
  const { nome } = setorSchema.parse(await request.json());

  const existente = await prisma.setor.findUnique({ where: { nome } });
  if (existente) throw new ApiError(409, "Já existe um setor com esse nome.", "SETOR_DUPLICADO");

  const setor = await prisma.setor.create({ data: { nome } });
  await registrarEvento({ tipo: "SETOR_CRIADO", usuarioId: admin.id, detalhe: { setorId: setor.id, nome } });

  return NextResponse.json({ id: setor.id, nome: setor.nome, temPalavra: false }, { status: 201 });
});
