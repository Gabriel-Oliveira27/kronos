import { NextResponse, type NextRequest } from "next/server";
import { exigirUsuario } from "@/lib/rbac";
import { comTratamentoDeErro, ApiError } from "@/lib/api";

interface Params {
  params: Promise<{ fileId: string }>;
}

/**
 * GET /api/v1/fotos/[fileId]
 *
 * Mantido para retrocompatibilidade. Novos uploads retornam URLs diretas do
 * Cloudinary armazenadas em Usuario.fotoUrl, então esta rota não é mais
 * chamada para fotos novas.
 *
 * Para fotos antigas (Google Drive), o fileId não é uma URL — retorna 404.
 * Para URLs completas (Cloudinary), redireciona diretamente.
 */
export const GET = comTratamentoDeErro(async (_request: NextRequest, { params }: Params) => {
  await exigirUsuario();
  const { fileId } = await params;

  // Se o fileId for uma URL completa (ex: migração ou forward),
  // redireciona para ela diretamente
  if (fileId.startsWith("http")) {
    return NextResponse.redirect(fileId);
  }

  // Legado: fotos no Google Drive não são mais servidas sem o proxy.
  // Para usuários com fotoUrl antiga, recomenda-se reenviar a foto.
  throw ApiError.naoEncontrado(
    "Foto não encontrada. Se a foto foi cadastrada antes da migração para o Cloudinary, " +
      "faça o upload novamente pelo painel de usuários."
  );
});
